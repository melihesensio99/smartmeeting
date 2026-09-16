using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;
using SmartMeeting.Application.Auth.Contracts;

namespace SmartMeeting.Application.Auth.Commands.Login;

public sealed record LoginCommand(string Email, string Password) : IRequest<Result<AuthenticatedUser>>;

public sealed class LoginValidator : AbstractValidator<LoginCommand>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128);
    }
}

public sealed class LoginCommandHandler(IIdentityService identityService) : IRequestHandler<LoginCommand, Result<AuthenticatedUser>>
{
    public Task<Result<AuthenticatedUser>> Handle(LoginCommand request, CancellationToken cancellationToken)
        => identityService.LoginAsync(request.Email, request.Password, cancellationToken);
}
