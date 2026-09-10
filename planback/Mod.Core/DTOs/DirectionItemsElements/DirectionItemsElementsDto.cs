namespace Mod.Core.DTOs.DirectionItemsElements
{
    public class DirectionItemsElementsDto
    {
        public int? Id {get;set;}
        public string Name { get; set; } = null!;
        public string? Comment { get; set; }
        public string? Status { get; set; }
    }
}
