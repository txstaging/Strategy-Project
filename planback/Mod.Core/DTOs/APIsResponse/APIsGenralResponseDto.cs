namespace Mod.Core.DTOs.APIsResponse
{
    public record APIsGenralResponseDto<T>(string Message, T Data);
}
