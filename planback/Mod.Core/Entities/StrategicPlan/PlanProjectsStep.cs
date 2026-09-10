using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Core.Entities.StrategicPlan
{
    public class PlanProjectsStep:BaseEntity
    {
        public int UnitId { get; set; }
        public Units Units { get; set; } = null!;
        public int PlanId { get; set; }
        public Plans Plan { get; set; }
        public ApprovalStatus Status { get; set; }
        public int? AppUserId { get; set; }
        public AppUser? User { get; set; }
        public ICollection<PlanProjects> Projects { get; set; } = new HashSet<PlanProjects>();

    }
}
