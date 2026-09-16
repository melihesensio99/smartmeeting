using FluentValidation;
using System.Net;
using SmartMeeting.Domain.Meetings;

namespace SmartMeeting.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try { await next(context); }
        catch (ValidationException exception)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            await context.Response.WriteAsJsonAsync(new { code = "validation_error", errors = exception.Errors.Select(x => new { x.PropertyName, x.ErrorMessage }) });
        }
        catch (DomainException exception)
        {
            logger.LogWarning(exception, "İş kuralı ihlali");
            context.Response.StatusCode = (int)HttpStatusCode.UnprocessableEntity;
            await context.Response.WriteAsJsonAsync(new { code = "domain_error", message = exception.Message });
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Beklenmeyen API hatası");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            await context.Response.WriteAsJsonAsync(new { code = "unexpected_error", message = "Beklenmeyen bir hata oluştu." });
        }
    }
}
