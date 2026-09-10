namespace Mod.APIs.Extensions
{
    public static class ConvertStringToDate
    {
        public static DateTime? ToDate(this string? date)
        {
            if (!string.IsNullOrWhiteSpace(date) && int.TryParse(date, out int year))
                return new DateTime(year, 1, 1); // Default to Jan 1st of the given year

            return null;
        }
    }
}
