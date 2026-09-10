using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Mod.Core.Enums;

namespace Mod.Core.Entities.StrategicPlan
{
    public class GoalItems:BaseEntity
    {
        public string Value { get; set; }
        public ApprovalStatus? Status { get; set; }
        public string? Comment { get; set; }
    }
}
