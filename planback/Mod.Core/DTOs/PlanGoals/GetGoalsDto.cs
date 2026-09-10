using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mod.Core.DTOs.Units;
using Mod.Core.Entities.StrategicPlan;

namespace Mod.Core.DTOs.PlanGoals
{
    public class GetGoalsDto
    {
        public int Id { get; set; }
        public int PlanId { get; set; }
        public string Status { get; set; }
        public string EmployeeName { get; set; }
        public string Date {  get; set; }
        public string UnitName { get; set; }
        public int UnitId { get; set; }
        public GoalItemDto Name { get; set; }
        public GoalItemDto Descripition { get; set; }
        public GoalItemDto Indicator { get; set; }
        public ICollection<GetAcceptableAnalysisPointDto> Strength { get; set; }=new HashSet<GetAcceptableAnalysisPointDto>();
        public ICollection<GetAcceptableAnalysisPointDto> Threat { get; set; } = new HashSet<GetAcceptableAnalysisPointDto>();
        public ICollection<GetAcceptableAnalysisPointDto> Risk { get; set; } = new HashSet<GetAcceptableAnalysisPointDto>();
        public ICollection<GetAcceptableAnalysisPointDto> Opportunity { get; set; } = new HashSet<GetAcceptableAnalysisPointDto>();
    }
    public class GetGoalsForInitiativeDto
    {
        public int Id { get; set; }
       
        public string Name { get; set; }
        public string Descripition { get; set; }
        public string Indicator { get; set; }
       
    }
}
