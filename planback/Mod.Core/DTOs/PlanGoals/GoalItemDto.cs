using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mod.Core.Enums;

namespace Mod.Core.DTOs.PlanGoals
{
    public class GoalItemDto
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public string Status { get; set; }
        public string? Comment { get; set; }
    }
}
