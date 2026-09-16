using FluentValidation;
using MediatR;

namespace SmartMeeting.Application.Common;

public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (!validators.Any()) return await next();
        var context = new ValidationContext<TRequest>(request);
        var failures = (await Task.WhenAll(validators.Select(x => x.ValidateAsync(context, cancellationToken)))).SelectMany(x => x.Errors).ToList();
        if (failures.Count > 0) throw new ValidationException(failures);
        return await next();
    }
}
