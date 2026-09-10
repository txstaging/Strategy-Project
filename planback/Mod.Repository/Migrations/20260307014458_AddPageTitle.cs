using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Mod.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddPageTitle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PageTitles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Key = table.Column<string>(type: "text", nullable: false),
                    PageName = table.Column<string>(type: "text", nullable: false),
                    DefaultValue = table.Column<string>(type: "text", nullable: false),
                    CurrentValue = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: true),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PageTitles", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PageTitles",
                columns: new[] { "Id", "CreatedAt", "CurrentValue", "DefaultValue", "DeletedAt", "IsDeleted", "Key", "PageName", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "اخبار القيادة", "اخبار القيادة", null, false, "home_leadership_news", "الصفحة الرئيسية", null },
                    { 2, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "الوحدات الرئيسية", "الوحدات الرئيسية", null, false, "home_main_units", "الصفحة الرئيسية", null },
                    { 3, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "الخطة الاستراتيجية", "الخطة الاستراتيجية", null, false, "home_strategic_plan", "الصفحة الرئيسية", null },
                    { 4, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "التوعية", "التوعية", null, false, "home_awareness", "الصفحة الرئيسية", null },
                    { 5, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "أهدافنا", "أهدافنا", null, false, "home_our_goals", "الصفحة الرئيسية", null },
                    { 6, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "رؤيتنا", "رؤيتنا", null, false, "home_our_vision", "الصفحة الرئيسية", null },
                    { 7, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "رسائلنا", "رسائلنا", null, false, "home_our_messages", "الصفحة الرئيسية", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_PageTitles_Key",
                table: "PageTitles",
                column: "Key",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PageTitles");
        }
    }
}
