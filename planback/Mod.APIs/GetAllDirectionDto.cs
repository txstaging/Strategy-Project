namespace Mod.APIs
{
    public class GetAllDirectionDto
    {
        public int Id { get; set; }
        public StrategicDirectionPointType type { get; set; }
        public string? name { get; set; } = string.Empty;
        public string status { get; set; }
        public string? comment { get; set; } = string.Empty;
        public ICollection<GetAllDirectionItemElementDto> DirectionItemsElements { get; set; } = new HashSet<GetAllDirectionItemElementDto>();
    }
    public class GetAllDirectionItemElementDto
    {
        public int Id { get; set; }
        public string value { get; set; } = string.Empty;
        public string? comment { get; set; } = string.Empty;

        public string status { get; set; }
    }
    public class GetAllDirectionDtoResponse
    {
        public ICollection<GetAllDirectionDto> Vision { get; set; }
        public ICollection<GetAllDirectionDto> Value { get; set; }
        public ICollection<GetAllDirectionDto> Message { get; set; }




    }
    public class PlanDirectionDto
    {
        public int id { get; set; }


        public string status { get; set; }
        public GetAllDirectionDtoResponse getAllDirectionDtoResponse { get; set; }


    }
}
