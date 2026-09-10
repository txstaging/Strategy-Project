using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Mod.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddPageTitleExtraKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "PageTitles",
                columns: new[] { "Id", "CreatedAt", "CurrentValue", "DefaultValue", "DeletedAt", "IsDeleted", "Key", "PageName", "UpdatedAt" },
                values: new object[,]
                {
                    { 8, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "المدونات", "المدونات", null, false, "home_blogs", "الصفحة الرئيسية", null },
                    { 9, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "المدونات", "المدونات", null, false, "page_blogs", "صفحة المدونات", null },
                    { 10, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "التوعية", "التوعية", null, false, "page_awareness", "صفحة التوعية", null },
                    { 11, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "أهدافنا", "أهدافنا", null, false, "page_our_goals", "صفحة الأهداف", null },
                    { 12, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "رؤيتنا", "رؤيتنا", null, false, "page_our_vision", "صفحة الرؤية", null },
                    { 13, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "رسائلنا", "رسائلنا", null, false, "page_our_messages", "صفحة الرسائل", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 13);
        }
    }
}
