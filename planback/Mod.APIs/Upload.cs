namespace Mod.APIs
{
    public static class Upload
    {
        public static string UploadFile(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return "File is empty.";


                string[] allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".pdf" };

                // التأكد من أن الملف صورة أو PDF
                string fileExtension = Path.GetExtension(file.FileName).ToLower();
                bool isImage = file.ContentType.StartsWith("image");
                bool isPdf = file.ContentType == "application/pdf";

                if (!allowedExtensions.Contains(fileExtension) || (!isImage && !isPdf))
                    return "Invalid file type.";


                string uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Uploads");


                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);


                string fileName = Guid.NewGuid() + fileExtension;
                string fullPath = Path.Combine(uploadPath, fileName);

                // حفظ الملف
                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    file.CopyTo(stream);
                }

                return $"Uploads/{fileName}";
            }
            catch (Exception ex)
            {
                return $"Error: {ex.Message}";
            }
        }

        // Used by report attachments. Accepts a configurable extension whitelist
        // and a sub-folder under wwwroot/Uploads so attachments don't mix with images.
        public static string UploadFile(IFormFile file, string[] allowedExtensions, string subFolder)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return "File is empty.";

                string fileExtension = Path.GetExtension(file.FileName).ToLower();
                if (!allowedExtensions.Contains(fileExtension))
                    return "Invalid file type.";

                string uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Uploads", subFolder);
                if (!Directory.Exists(uploadPath))
                    Directory.CreateDirectory(uploadPath);

                string fileName = Guid.NewGuid() + fileExtension;
                string fullPath = Path.Combine(uploadPath, fileName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    file.CopyTo(stream);
                }

                return $"Uploads/{subFolder}/{fileName}";
            }
            catch (Exception ex)
            {
                return $"Error: {ex.Message}";
            }
        }
    }
}
