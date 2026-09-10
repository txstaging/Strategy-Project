namespace Mod.Core.DTOs.PlanAnalysis
{
    public class PlanAnalysisToReturnDto
    {
        public int Id { get; set; }
        public string Status { get; set; }
        public string EmployeeName { get; set; }
        public string CreatedAt { get; set; }
        public string UnitName { get; set; }
        public int PlanId { get; set; }
        public int UnitId { get; set; }
    }
}
