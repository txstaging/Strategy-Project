namespace Mod.Core.Entities.Identity
{
    public class UserRoleClaim : IdentityRoleClaim<int>
    {
        public string Module { get; set; } = string.Empty;
        public string Permission { get; set; } = string.Empty;
    }
}
