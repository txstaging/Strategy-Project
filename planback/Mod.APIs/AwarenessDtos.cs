namespace Mod.APIs
{
    public class AddAwarenessDto
    {
        public string Title { get; set; }
        public string Date { get; set; }
        public IFormFile? Image { get; set; }
        public string Text { get; set; }
    }
    public class GetAwarenessDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Date { get; set; }
        public string ImagePath { get; set; }
        public string Text { get; set; }
        public bool Status { get; set; }
    }
    public class UpdateAwarenessDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Date { get; set; }
        public IFormFile? Image { get; set; }
        public string ? Text { get; set; }
        public bool? Status { get; set; }
    }
}
