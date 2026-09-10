using Mod.Core.DTOs.Report;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Core.RepositoriesContract
{
    public interface IReportRepository
    {
        Task<List<UnitReport>> GetAll();
    }
}
