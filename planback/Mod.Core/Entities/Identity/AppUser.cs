namespace Mod.Core.Entities.Identity
{
    public class AppUser: IdentityUser<int>
    {
        public int? UnitId { get; set; }
        public Units? Units { get; set; } = null!;
        public bool? IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }
        public DateOnly? Date { get; set; } = DateOnly.FromDateTime(DateTime.Now);
        public required string DisplayName { get; set; }
        public string? Phone {  get; set; }
        public string? Number { get; set; }

        [NotMapped]
		public string? Role { get; set; } = null!;
        public bool? IsActive { get; set; }=true;
        public string ?PasswordV2 { get; set; } = null!;
    }
}
