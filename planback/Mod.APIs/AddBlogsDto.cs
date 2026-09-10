namespace Mod.APIs
{
    public class AddBlogDto
    {
        public string Title { get; set; }
        public string Date { get; set; }
        public IFormFile Image { get; set; }
        public string Text { get; set; }
    }
    public class GetBlogDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Date { get; set; }
        public string ImagePath { get; set; }
        public string Text { get; set; }
        public bool Status { get; set; }
    }
    public class UpdateBlogDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Date { get; set; }
        public IFormFile? Image { get; set; }
        public string ? Text { get; set; }
        public bool? Status { get; set; }
    }
}
