using Microsoft.Extensions.Configuration;
using Mod.Core.DTOs.Report;
using Newtonsoft.Json;
using Npgsql;

namespace Mod.Repository.Implement.Repositories
{
    public class ReportRepository : IReportRepository
    {
        #region Failds
        private readonly ModContext _context;
        private readonly IConfiguration _configuration;
        #endregion

        #region Constructors
        public ReportRepository(ModContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }
        #endregion

        #region Methods

        #region Public
        public async Task<List<UnitReport>> GetAll()
        {
            //return await GetUnitReport(unitId);

            #region With LINQ

            var unitReports = _context.Units.ToList() // Fetch Data from Database
                .Select(u => new UnitReport()
                {
                    UnitId = u.Id,
                    UnitName = u.Name,

                    Goals = _context.PlanGoals
                        .Where(g => g.UnitId == u.Id && g.PlanInitiatives.Any(i => i.PlanProjects.Any())).Include(i=>i.PlanProjects).ThenInclude(i=>i.Name).Include(i=>i.PlanProjects).Include(i=>i.PlanInitiatives).ThenInclude(i => i.Name).Include(i=>i.PlanInitiatives)
                        .Select(g => new GoalReport
                        {
                            GoalId = g.Id,
                            GoalName = g.Name.Value,
                            GoalPercentage=g.Percentage,

                            Initiatives = _context.PlanInitiatives
                                .Where(i => i.GoalId == g.Id && i.PlanProjects.Any())
                                .Select(i => new InitiativeReport
                                {
                                    InitiativeId = i.Id,
                                    InitiativeName = i.Name.Value,
                                    InitiativePercentage = i.Percentage,


                                    Projects = _context.PlanProjects
                                        .Where(p => p.PlanInitiativeId == i.Id)
                                        .Select(p => new ProjectReport
                                        {
                                            ProjectId = p.Id,
                                            ProjectName = p.Name.Value,
                                            Percentage = p.Percentage != null ? (double?)Convert.ToDouble(p.Percentage.Value) : null,
                                            PercentageStatus = p.Percentage != null && p.Percentage.Status != null ? p.Percentage.Status.Value.ToString() : null,
                                            PercentageComment = p.Percentage != null ? p.Percentage.Comment : null,
                                            PercentageItemId = p.PercentageId,
                                            // Latest attachment uploaded for this project's percentage cycle.
                                            PercentageFilePath = _context.ProjectPercentageHistory
                                                .Where(h => h.ProjectId == p.Id && h.FilePath != null)
                                                .OrderByDescending(h => h.Id)
                                                .Select(h => h.FilePath)
                                                .FirstOrDefault(),
                                            Priority = p.Priority.Value,
                                            StartDate = p.StartDate.ToString("yyyy-MM-dd"),
                                            EndDate = p.EndDate.ToString("yyyy-MM-dd"),
                                            Code = p.Code != null ? p.Code : "",



                                        })
                                        .ToList()
                                })
                                .ToList()
                        })
                        .ToList()
                })
                .ToList(); // Fetch Data from Database

            // Compute Averages After Fetching
            foreach (var unit in unitReports)
            {

                foreach (var goal in unit.Goals)
                {

                    foreach (var initiative in goal.Initiatives)
                    {
                        foreach (var project in initiative.Projects)
                        {
                            // Project level - already have percentage
                            if(project.Percentage!=100 && DateTime.Parse(project.EndDate)<DateTime.UtcNow)
                            {
                                // Do nothing, already set
                                project.TimeLine=TimeLine.Completed;

                            }
                        }
                        // Roll up the initiative completion as the average of its projects.
                        initiative.InitiativePercentage = initiative.Projects.Any()
                            ? Math.Round(initiative.Projects.Average(p => p.Percentage ?? 0), 2)
                            : 0;
                        if(initiative.Projects.Any(i=>i.TimeLine==TimeLine.Completed))
                        {
                            initiative.TimeLine = TimeLine.Completed;
                        }
                    }
                    // Roll up the goal completion as the average of its initiatives.
                    goal.GoalPercentage = goal.Initiatives.Any()
                        ? Math.Round(goal.Initiatives.Average(i => i.InitiativePercentage ?? 0), 2)
                        : 0;
                    if (goal.Initiatives.Any(i => i.TimeLine == TimeLine.Completed))
                    {
                        goal.TimeLine = TimeLine.Completed;
                    }
                }
                // Roll up the unit completion as the average of its goals.
                unit.UnitPercentage = unit.Goals.Any()
                    ? Math.Round(unit.Goals.Average(g => g.GoalPercentage ?? 0), 2)
                    : 0;
            }

            return unitReports;
            #endregion
        }

        #endregion

        #region Private
        private async Task<List<UnitReport>> GetUnitReport(int unitId)
        {
            List<UnitReport> result = null;

            // Define the SQL command to call the function
            string sql = "SELECT \"GetAllUnitReports\"(@unit_id)";
            using (var connection = new NpgsqlConnection(_configuration.GetConnectionString("DefaultConnection")))
            {
                await connection.OpenAsync();

                using (var command = new NpgsqlCommand(sql, connection))
                {
                    // Add parameter
                    command.Parameters.AddWithValue("unit_id", unitId);

                    // Execute the function and retrieve the result
                    var jsonResult = await command.ExecuteScalarAsync() as string;

                    if (!string.IsNullOrEmpty(jsonResult))
                    {
                        result = JsonConvert.DeserializeObject<List<UnitReport>>(jsonResult);
                    }
                }
            }
            return result;
        }
        #endregion

        #endregion


    }
}
