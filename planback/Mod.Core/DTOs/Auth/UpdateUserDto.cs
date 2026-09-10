namespace Mod.Core.DTOs.Auth
{
    public class UpdateUserDto
    {
        public Dictionary<string, List<string>> ModulePermissions { get; set; } = new();
    }
}
