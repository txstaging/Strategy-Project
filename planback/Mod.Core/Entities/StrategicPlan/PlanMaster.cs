namespace Mod.Core.Entities.StrategicPlan
{
    public class PlanMaster:BaseEntity
    {
        [Required]
        public string name { get; set; } = null!;
        public ICollection<Plans> Plans { get; set; }=new HashSet<Plans>();
    }
}
