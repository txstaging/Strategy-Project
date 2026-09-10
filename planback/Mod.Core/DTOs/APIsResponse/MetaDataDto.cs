namespace Mod.Core.DTOs.APIsResponse
{
    public class MetaDataDto
    {
        public int? CurrentPage { get; set; }
        public int? PerPage { get; set; }
        public int? LastPage { get; set; }
        public int? Total { get; set; }
        public int? From { get; set; }
        public int? To { get; set; }
    }
}
