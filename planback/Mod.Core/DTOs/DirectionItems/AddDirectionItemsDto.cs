namespace Mod.Core.DTOs.DirectionItems
{
    public class AddDirectionItemsDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = null!;
        public string Type { get; set; }
        public string? Comment { get; set; }
        public ICollection<DirectionItemsElementsDto> DirectionItemsElements { get; set; }=new HashSet<DirectionItemsElementsDto>();
    }
}
