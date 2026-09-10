using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Core.Entities.Initiative
{
    public class PlanInitiativeStep:BaseEntity
    {
        public int UnitId { get; set; }
        public Units Units { get; set; } = null!;
        public int PlanId { get; set; }
        public Plans Plan { get; set; }
        public ApprovalStatus Status { get; set; }
        public int? AppUserId { get; set; }
        public AppUser? User { get; set; }
        public ICollection<PlanInitiative> Initiative { get; set; } = new HashSet<PlanInitiative>();
    }
}
