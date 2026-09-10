using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Core.DTOs.PlanProjects
{
    public class GetAcceptableGoalsDto
    { 
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Indicator { get; set; }
    }
}
