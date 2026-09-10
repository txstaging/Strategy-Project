namespace Mod.APIs.DTOs.Auth
{
    public class UserDto
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public string Name { get; set; }
        [Required]
        public string Email { get; set; }
        public string? Role { get; set; }
        public int? PlanId { get; set; }
        public Dictionary<string, List<string>> Permissions { get; set; } = new();
    }
}
