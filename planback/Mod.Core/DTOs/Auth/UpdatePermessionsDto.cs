using System.Text.Json.Serialization;

namespace Mod.Core.DTOs.Auth
{
    public class UpdatePermessionsDto
    {
        [Required]
        public int UserId { get; set; }


        [Required] 
        public string Role { get; set; } = string.Empty;

        [Required]
        [JsonPropertyName("modulePermissions")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, List<string>> ModulePermissions { get; set; } = new();
    }
}
