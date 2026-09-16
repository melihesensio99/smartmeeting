using MediatR;
using SmartMeeting.Application.Abstractions.Identity;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Users.Responses;

namespace SmartMeeting.Application.Users.Queries.SearchUsers;

public sealed record SearchUsersQuery(string Search) : IRequest<Result<IReadOnlyCollection<UserResponse>>>;

public sealed class SearchUsersQueryHandler(IUserDirectoryService userDirectoryService) : IRequestHandler<SearchUsersQuery, Result<IReadOnlyCollection<UserResponse>>>
{
    public async Task<Result<IReadOnlyCollection<UserResponse>>> Handle(SearchUsersQuery request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Search) || request.Search.Trim().Length < 2)
            return Result<IReadOnlyCollection<UserResponse>>.Failure("search_too_short", "Kullanıcı araması en az 2 karakter olmalıdır.");

        return Result<IReadOnlyCollection<UserResponse>>.Success(await userDirectoryService.SearchAsync(request.Search.Trim(), cancellationToken));
    }
}
