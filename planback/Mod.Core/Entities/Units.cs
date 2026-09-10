namespace Mod.Core.Entities
{
    public class Units:BaseEntity
    {
        public string Name { get; set; } = null!;

        public ICollection<AppUser> Users { get; set; } = new HashSet<AppUser>();
        public int? RegionId {  get; set; }

        public Regions? Regions { get; set; }

        //public ICollection<PlanGoals> PlanGoals { get; set; } = new HashSet<PlanGoals>();
    }
}
