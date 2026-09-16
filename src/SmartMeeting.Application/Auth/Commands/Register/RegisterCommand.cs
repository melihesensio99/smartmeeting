using FluentValidation;
using MediatR;
using SmartMeeting.Application.Abstractions;
using SmartMeeting.Application.Common;

namespace SmartMeeting.Application.Auth.Commands.Register;

public sealed record RegisterCommand(string Email, string Password, string DisplayName) : IRequest<Result<RegisteredUser>>;

public sealed class RegisterValidator : AbstractValidator<RegisterCommand>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(160);
    }
}

public sealed class RegisterHandler(IIdentityService identityService) : IRequestHandler<RegisterCommand, Result<RegisteredUser>>
{
    public Task<Result<RegisteredUser>> Handle(RegisterCommand request, CancellationToken cancellationToken)
        => identityService.RegisterAsync(request.Email, request.Password, request.DisplayName, cancellationToken);
}
