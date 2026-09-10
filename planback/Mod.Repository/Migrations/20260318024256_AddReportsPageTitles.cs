using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Mod.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddReportsPageTitles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "PageTitles",
                columns: new[] { "Id", "CreatedAt", "CurrentValue", "DefaultValue", "DeletedAt", "IsDeleted", "Key", "PageName", "UpdatedAt" },
                values: new object[,]
                {
                    { 40, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "التقارير", "التقارير", null, false, "reports_title", "التقارير", null },
                    { 41, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "وصف اهداف الخطة الاستراتيجية", "وصف اهداف الخطة الاستراتيجية", null, false, "reports_description", "التقارير", null },
                    { 42, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "نسبة الانجاز", "نسبة الانجاز", null, false, "reports_completion", "التقارير", null },
                    { 43, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "النموذج المجمع", "النموذج المجمع", null, false, "reports_collective_template", "التقارير", null },
                    { 44, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "التقرير المجمع", "التقرير المجمع", null, false, "reports_collective_report", "التقارير", null },
                    { 45, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "اسم الوحدة", "اسم الوحدة", null, false, "reports_unit_name", "التقارير", null },
                    { 46, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "نسبة الإنجاز", "نسبة الإنجاز", null, false, "reports_completion_percentage", "التقارير", null },
                    { 47, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "الأهداف", "الأهداف", null, false, "reports_goals", "التقارير", null },
                    { 48, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "المبادرات", "المبادرات", null, false, "reports_initiatives", "التقارير", null },
                    { 49, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "المشاريع", "المشاريع", null, false, "reports_projects", "التقارير", null },
                    { 50, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "إجمالي نسبة الإنجاز لجميع الوحدات", "إجمالي نسبة الإنجاز لجميع الوحدات", null, false, "reports_total_summary", "التقارير", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 40);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 41);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 42);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 43);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 44);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 45);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 46);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 47);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 48);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 49);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 50);
        }
    }
}
