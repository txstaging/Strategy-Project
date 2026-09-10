namespace Mod.Core.RepositoriesContract
{
    public interface IAnalysisPointsRepository
    {
        Task<AnalysisPoints> Add(AnalysisPoints point);
        Task<AnalysisPoints> GetById(int id);
        Task<IEnumerable<AnalysisPoints>> GetAll();
        Task<AnalysisPoints> Delete(int id);
        Task<AnalysisPoints> Update(AnalysisPoints point);
        IQueryable<AnalysisPoints> GetAcceptablePoint(Expression<Func<AnalysisPoints, bool>>? predicate = null);
    }
}
