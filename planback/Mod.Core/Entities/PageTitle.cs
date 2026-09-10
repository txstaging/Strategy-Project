namespace Mod.Core.Entities
{
    public class PageTitle : BaseEntity
    {
        public string Key { get; set; }
        public string PageName { get; set; }
        public string DefaultValue { get; set; }
        public string CurrentValue { get; set; }
    }
}
