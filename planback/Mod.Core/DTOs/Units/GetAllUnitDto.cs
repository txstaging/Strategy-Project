namespace Mod.Core.DTOs.Units
{
    public class GetAllUnitDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public Regions? Regions { get; set; }
    }
}
