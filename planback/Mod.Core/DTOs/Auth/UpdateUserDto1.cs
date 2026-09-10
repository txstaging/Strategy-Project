using System.Text.Json.Serialization;

namespace Mod.Core.DTOs.Auth
{
    public class UpdateUserDtoo
    {
        [Required]
        public int UserId { get; set; }


        public int? UnitId { get; set; }

      
        public string? UserName { get; set; } = null!;
     
        public string? Email { get; set; }
       
        public string? Password { get; set; }
      
        public string? Role { get; set; } = null!;
      
        public string? PhoneNumber { get; set; }

        [Required]
        [JsonPropertyName("permissions")]
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public Dictionary<string, List<string>> ModulePermissions { get; set; } = new();
    }
}
