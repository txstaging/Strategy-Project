using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mod.Core.Entities.StrategicPlan;

namespace Mod.Core.DTOs.PlanProjects
{
    public class AddPlanProjectDto
    {
        public string Name { get; set; }
        public string Priority { get; set; }
        public string Duration { get; set; }
        public string Beneficiaries { get; set; }
        public string SupervisingAuthority { get; set; }
        public string Weight { get; set; }
        public string Code { get; set; }
        public string? Percentage { get; set; }
        public int PlanInitiativeId { get; set; }
        public int PlanGoalsId { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
    }
}
