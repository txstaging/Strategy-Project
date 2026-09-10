namespace Mod.Core.DTOs.Initiatives
{
    public class AddInitiativesDto
    {
        public int GoalId { get; set; }
        public List<InitiativeItemAddDto> InitiativeItem {  get; set; }=new List<InitiativeItemAddDto>();
        public List<InitiativeKpiAddDto> InitiativeKPIs { get; set; } = new List<InitiativeKpiAddDto>();
        public string name { get; set; }
        public double? InitiativeWeight { get; set; }

    }
    public class GetInitiativesDto
    {
        public int Id { get; set; }
        public string? Status { get; set; }
        public string? Comment { get; set; }
        public InitiativesItemDto name { get; set; }

        public GetGoalsForInitiativeDto Goal { get; set; }
        public int PlanId { get; set; }
        public int UnitId { get; set; }
        public double? InitiativeWeight { get; set; }
        public List<InitiativesItemDto> InitiativeItem { get; set; } = new List<InitiativesItemDto>();
       

        public List<InitiativeKpiDto> InitiativeKPIs { get; set; } = new List<InitiativeKpiDto>();
        
    }
    public class GetAllInitiativesDto
    {
        public int Id { get; set; }
        public string? Status { get; set; }
        public string? Comment { get; set; }
        public string name { get; set; }
        
 
 public string GoalName { get; set; }
 public double? InitiativeWeight { get; set; }

 public string EmployeeName { get; set; }
 public string Date { get; set; }
 public string UnitName { get; set; }
      
       


    }

    public class UpdateInitiativesDto
    {
        public int Id { get; set; }
        public string? Status { get; set; }
        public string? Comment { get; set; }

        public int GoalId { get; set; }
        public InitiativeItemUpdateDto Name { get; set; }
        public List<InitiativeItemUpdateDto> InitiativeItem { get; set; } = new List<InitiativeItemUpdateDto>();

        public List<InitiativeKpiDto> InitiativeKPIs { get; set; } = new List<InitiativeKpiDto>();
    }
    public class DeleteInitiativesDto
    {
        public int Id { get; set; }
    }

    public class UpdateStatusDto
    {
        public int Id { get; set; }
        public string? Status { get; set; }
        public string? Comment { get; set; }
    }
}
