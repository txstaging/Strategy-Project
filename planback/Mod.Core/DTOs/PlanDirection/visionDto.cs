namespace Mod.Core.DTOs.PlanDirection
{
    public class VisionDto
    {
        public int Id { get; set; }
        public string content { get; set; }
        public string status { get; set; }
        public ICollection<DirectionItemsElementsDto> elements { get; set; } = new HashSet<DirectionItemsElementsDto>();
    }
}
