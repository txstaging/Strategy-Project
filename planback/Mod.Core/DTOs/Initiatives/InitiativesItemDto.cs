using Mod.Core.Enums;

namespace Mod.Core.DTOs.Initiatives
{
    public class InitiativesItemDto
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public string Status { get; set; }
        public string? Comment { get; set; }
        public InitiativeItemType Type { get; set; }
    }
    
    public class InitiativeItemAddDto
    {
        public string Value { get; set; }
        public InitiativeItemType Type { get; set; }
    }
    public class InitiativeItemUpdateDto
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public string Status { get; set; }
        public string? Comment { get; set; }
        public InitiativeItemType? Type { get; set; }
    }
    public class InitiativeItemDeleteDto
    {
        public int Id { get; set; }
    }
}
