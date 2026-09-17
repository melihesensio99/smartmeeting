using FluentValidation;
using MediatR;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Application.Meetings.Commands.CreateMeeting;

public sealed record CreateMeetingCommand(string Title, DateTimeOffset StartsAt, DateTimeOffset? EndsAt) : IRequest<Result<MeetingResponse>>;

public sealed class CreateMeetingValidator : AbstractValidator<CreateMeetingCommand>
{
    public CreateMeetingValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(160);
        RuleFor(x => x.EndsAt).GreaterThan(x => x.StartsAt).When(x => x.EndsAt.HasValue);
    }
}

public sealed class CreateMeetingCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser) : IRequestHandler<CreateMeetingCommand, Result<MeetingResponse>>
{
    public async Task<Result<MeetingResponse>> Handle(CreateMeetingCommand request, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAuthenticated || string.IsNullOrWhiteSpace(currentUser.UserId))
            return Result<MeetingResponse>.Failure("authentication_required", "Toplantı oluşturmak için giriş yapmalısınız.");
        if (!currentUser.CanCreateMeetings)
            return Result<MeetingResponse>.Failure("meeting_create_forbidden", "Toplantı oluşturma yetkiniz yok.");
        var meeting = Meeting.Create(request.Title, currentUser.UserId, request.StartsAt.ToUniversalTime(), request.EndsAt?.ToUniversalTime());
        db.AddMeeting(meeting);
        await db.SaveChangesAsync(cancellationToken);
        return Result<MeetingResponse>.Success(MeetingResponse.From(meeting));
    }
}
