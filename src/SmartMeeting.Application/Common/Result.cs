namespace SmartMeeting.Application.Common;

public class Result<T>
{
    private Result(T? value, Error? error) { Value = value; Error = error; }
    public T? Value { get; }
    public Error? Error { get; }
    public bool IsSuccess => Error is null;
    public static Result<T> Success(T value) => new(value, null);
    public static Result<T> Failure(string code, string message) => new(default, new Error(code, message));
}

public sealed class Result
{
    private Result(bool isSuccess, Error? error = null) { IsSuccess = isSuccess; Error = error; }
    public bool IsSuccess { get; }
    public Error? Error { get; }
    public static Result Success() => new(true);
    public static Result Failure(string code, string message) => new(false, new Error(code, message));
}
