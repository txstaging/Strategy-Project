using Mod.Core.Services.Contract;

namespace Mod.Service.Services.Implementation.ReportService
{
    public class ReportService : IReportService
    {
        #region Failds
        private readonly IReportRepository _reportRepository;
        #endregion

        #region Constructors
        public ReportService(IReportRepository reportRepository)
        {
            _reportRepository = reportRepository;
        }
        #endregion

        #region Methods

        #region Public
        public async Task<List<UnitReport>> GetAll()
        {
            return await _reportRepository.GetAll();
        }
        #endregion

        #region Private

        #endregion

        #endregion
    }
}
