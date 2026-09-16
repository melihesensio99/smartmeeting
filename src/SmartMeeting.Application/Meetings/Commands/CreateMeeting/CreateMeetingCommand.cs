using FluentValidation;
using MediatR;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Meetings.Dtos;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Meetings.Commands.CreateMeeting;

public sealed record CreateMeetingCommand(string Title, DateTimeOffset StartsAt, DateTimeOffset? EndsAt) : IRequest<Result<MeetingDto>>;

public sealed class CreateMeetingValidator : AbstractValidator<CreateMeetingCommand>
{
    public CreateMeetingValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.EndsAt).GreaterThan(x => x.StartsAt).When(x => x.EndsAt.HasValue);
    }
}

public sealed class CreateMeetingHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<CreateMeetingCommand, Result<MeetingDto>>
{
    public async Task<Result<MeetingDto>> Handle(CreateMeetingCommand request, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAuthenticated || string.IsNullOrWhiteSpace(currentUser.UserId))
            return Result<MeetingDto>.Failure("authentication_required", "Toplantı oluşturmak için giriş yapmalısınız.");
        var meeting = Meeting.Create(request.Title, currentUser.UserId, request.StartsAt, request.EndsAt);
        db.AddMeeting(meeting);
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingDto>.Success(MeetingDto.From(meeting));
    }
}
