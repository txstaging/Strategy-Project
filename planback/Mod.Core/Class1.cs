using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Core
{
    public class GetAllPoints
    {
        public ICollection<AddAnalysisPointsDto> Strenth { get; set; } = new HashSet<AddAnalysisPointsDto>();
        public ICollection<AddAnalysisPointsDto> Risks { get; set; } = new HashSet<AddAnalysisPointsDto>();
        public ICollection<AddAnalysisPointsDto> Opportunities { get; set; } = new HashSet<AddAnalysisPointsDto>();
        public ICollection<AddAnalysisPointsDto> Threats { get; set; } = new HashSet<AddAnalysisPointsDto>();


    }
}
