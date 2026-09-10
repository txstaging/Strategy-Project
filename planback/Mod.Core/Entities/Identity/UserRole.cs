namespace Mod.Core.Entities.Identity
{
    public class UserRole : IdentityRole<int>
    {
        public virtual ICollection<UserRoleClaim> UserRoleClaims { get; set; } = new HashSet<UserRoleClaim>();
    }
}
