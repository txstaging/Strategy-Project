namespace Mod.Core.DTOs.APIsResponse
{
    public class AuthResponseFailDto<T>
    {
        public string Message { get; set; }
        public T? Errors { get; set; }=default(T?);

        public AuthResponseFailDto(string message, T errors)
        {
            Message = message;
            Errors = errors;

        }
    }
}
