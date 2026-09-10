using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mod.Core.DTOs.Initiatives;

namespace Mod.Core.DTOs.PlanProjects
{
    public class GetPlanProjectsDto
    {
        public int Id { get; set; }
        public object PlanInitiative { get; set; }
        public GetAcceptableGoalsDto? PlanGoals { get; set; }
        public int? PlanGoalsId { get; set; }
        public int? PlanInitiativeId { get; set; }
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public ProjectItemsDto? Name { get; set; }
        public ProjectItemsDto? Priority { get; set; }
        public ProjectItemsDto? Duration { get; set; }
        public ProjectItemsDto? Beneficiaries { get; set; }
        public ProjectItemsDto? SupervisingAuthority { get; set; }
        public ProjectItemsDto? Weight { get; set; }
        public string Code { get; set; }
        public string Status { get; set; }
        public int PlanId { get; set; }
        public string EmployeeName { get; set; }
        public string Date { get; set; }
        public string UnitName { get; set; }
        public int UnitId { get; set; }
        public ProjectItemsDto? Percentage { get; set; }
        public ProjectItemsDto? StartDateItem { get; set; }
        public ProjectItemsDto? EndDateItem { get; set; }




    }
}
