using MediatR;
using SmartMeeting.Application.Abstractions.Identity;
using SmartMeeting.Application.Auth.Responses;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Auth.Queries.GetCurrentUser;

public sealed record GetCurrentUserQuery : IRequest<Result<CurrentUserResponse>>;

public sealed class GetCurrentUserQueryHandler(ICurrentUserService currentUser, IIdentityService identityService) : IRequestHandler<GetCurrentUserQuery, Result<CurrentUserResponse>>
{
    public async Task<Result<CurrentUserResponse>> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (!currentUser.IsAuthenticated || string.IsNullOrWhiteSpace(currentUser.UserId))
            return Result<CurrentUserResponse>.Failure("unauthorized", "Oturum açmanız gerekiyor.");

        var user = await identityService.FindByIdAsync(currentUser.UserId, cancellationToken);
        return user is null
            ? Result<CurrentUserResponse>.Failure("user_not_found", "Kullanıcı bulunamadı.")
            : Result<CurrentUserResponse>.Success(new CurrentUserResponse(user.UserId, user.Email, user.DisplayName, currentUser.IsGlobalManager, currentUser.CanCreateMeetings));
    }
}
