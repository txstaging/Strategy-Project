namespace Mod.Core.DTOs.Initiatives
{
    public class InitiativeKpiDto
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public string Status { get; set; }
        public string? Comment { get; set; }
    }
    public class InitiativeKpiAddDto
    {
        public string Value { get; set; }
    }
    public class InitiativeKpiUpdateDto
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public ApprovalStatus? Status { get; set; }
        public string? Comment { get; set; }
    }
    public class InitiativeKpiDeleteDto
    {
        public int Id { get; set; }
    }
}
