using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Core.Entities
{
    public class OurGoals:BaseEntity
    {
        public string Title { get; set; }
        public DateTime Date { get; set; }
        public string? ImagePath {  get; set; }
        public string Text { get; set; }
        public bool Status { get; set; } = true;
    }

}
