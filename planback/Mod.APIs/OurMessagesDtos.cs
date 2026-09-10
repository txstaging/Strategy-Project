namespace Mod.APIs
{
    public class AddOurMessagesDto
    {
        public string Title { get; set; }
        public string Date { get; set; }
        public IFormFile? Image { get; set; }
        public string Text { get; set; }
    }
    public class GetOurMessagesDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Date { get; set; }
        public string ImagePath { get; set; }
        public string Text { get; set; }
        public bool Status { get; set; }
    }
    public class UpdateOurMessagesDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Date { get; set; }
        public IFormFile? Image { get; set; }
        public string ? Text { get; set; }
        public bool? Status { get; set; }
    }
}
