namespace Mod.Core.DTOs.APIsResponse
{
    public class APIsResponseFilterDto<T>
    {
        public List<T> Data { get; set; }
        public MetaDataDto Metadata { get; set; }
		public String Status { get; set; }
	}
}
