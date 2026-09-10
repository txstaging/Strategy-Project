namespace Mod.Core.Entities
{
    public class Regions: BaseEntity
    {
        public string Name { get; set; }
        public ICollection<Units>Units { get; set; }=new HashSet<Units>();
    }
}
