using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Core.DTOs.PlanGoals
{
    public class AddGoalDto
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Indicator { get; set; }
        public IEnumerable<int> AnalysisPoints { get; set; }=new List<int>();
        public string? Status { get; set; }
    }
}
