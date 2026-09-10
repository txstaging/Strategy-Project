using System.Text.Json.Serialization;

namespace Mod.APIs.DTOs.Auth
{
    public class RegisterDto
    {
        // Optional. RegionManager (and roles above units) should not be tied to a specific unit.
        // For unit-scoped roles (UnitEmployee / UnitManager) the controller validates this is set.
        public int? UnitId { get; set; }

        [Required]
        public string UserName { get; set; } = null!;
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        public string Role { get; set; } = null!;
        [Required]
        public string PhoneNumber { get; set; } = null!;

        [Required]
        [JsonPropertyName("modulePermissions")]
        public Dictionary<string, List<string>> ModulePermissions { get; set; } = new();
    }
}
