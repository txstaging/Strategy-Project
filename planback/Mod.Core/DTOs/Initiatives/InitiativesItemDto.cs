using System.Text.Json.Serialization;
using Mod.Core.Enums;

namespace Mod.Core.DTOs.Initiatives
{
    public class InitiativesItemDto
    {
        public int Id { get; set; }
        public string Value { get; set; }
        public string Status { get; set; }
        public string? Comment { get; set; }

        // Serialized as a number, not as the enum name.
        //
        // Program.cs registers a global JsonStringEnumConverter, so this used to
        // go out as "AdminInCharge" while the Angular side treats the item type
        // as the numeric 1/2/3 everywhere: the edit form's <option> values, the
        // label lookup, the view modal's colour and icon rules, and the payload
        // it posts back. The mismatch left the «نوع العنصر» dropdown blank when
        // reopening an initiative, so the employee's chosen type looked lost.
        [JsonConverter(typeof(JsonNumberEnumConverter<InitiativeItemType>))]
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
