using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mod.Core.Entities.Identity;
using Mod.Core.Enums;

namespace Mod.Core.Entities.StrategicPlan
{
    public class PlanGoalsStep:BaseEntity
    {
        public int UnitId { get; set; }
        public Units Units { get; set; } = null!;
        public int PlanId { get; set; }
        public Plans Plan { get; set; }
        public ApprovalStatus Status { get; set; }
        public int? AppUserId { get; set; }
        public AppUser? User { get; set; }
        public ICollection<PlanGoals> Goals { get; set; } = new HashSet<PlanGoals>();
    }
}
