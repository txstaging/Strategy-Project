using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mod.Core.Entities.Identity;
using Mod.Core.Entities.Initiative;
using Mod.Core.Enums;

namespace Mod.Core.Entities.StrategicPlan
{
    public class PlanGoals:BaseEntity
    {
        public ApprovalStatus? Status { get; set; }
        public int? AppUserId { get; set; }
        public AppUser? User { get; set; }
        public ICollection<AnalysisPoints> AnalysisPoints { get; set; } = new HashSet<AnalysisPoints>();
        public int PlanId { get; set; }
        public Plans Plan { get; set; }
        public int UnitId { get; set; }
        public Units Units { get; set; } = null!;
        public string ? Comment { get; set; }
        public int NameId { get; set; }
        public GoalItems Name { get; set; }
        public int DescripitionId { get; set; }
        public GoalItems Descripition { get; set; }
        public int IndicatorId { get; set; }
        public GoalItems Indicator { get; set; }
        public double GoalWeight { get; set; } = 0;
        public int? planGoalsStepId { get; set; }
        public PlanGoalsStep? planGoalsStep { get; set; }
        public double? Percentage { get; set; }
        public ICollection<PlanInitiative> PlanInitiatives { get; set; } = new HashSet<PlanInitiative>();
        public ICollection<PlanProjects> PlanProjects { get; set; } = new HashSet<PlanProjects>();
    }
}
