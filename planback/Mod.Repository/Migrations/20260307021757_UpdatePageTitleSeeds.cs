using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Mod.Repository.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePageTitleSeeds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "المدونات", "المدونات", "blogs_page_title", "المدونات" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "قسم المدونات", "قسم المدونات", "blogs_section_title", "المدونات" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "أبرز الأخبار", "أبرز الأخبار", "blogs_top_news", "المدونات" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "إدارة المدونات", "إدارة المدونات", "blogs_manage_title", "المدونات" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "قائمة المدونات", "قائمة المدونات", "blogs_list_title", "المدونات" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "التوعية", "التوعية", "awareness_page_title", "التوعية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "أبرز المواضيع", "أبرز المواضيع", "awareness_top_topics", "التوعية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "إدارة التوعية", "إدارة التوعية", "awareness_manage_title", "التوعية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "قائمة التوعية", "قائمة التوعية", "awareness_list_title", "التوعية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "أهدافنا", "أهدافنا", "goals_page_title", "الأهداف" });

            migrationBuilder.InsertData(
                table: "PageTitles",
                columns: new[] { "Id", "CreatedAt", "CurrentValue", "DefaultValue", "DeletedAt", "IsDeleted", "Key", "PageName", "UpdatedAt" },
                values: new object[,]
                {
                    { 14, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "قسم الأهداف", "قسم الأهداف", null, false, "goals_section_title", "الأهداف", null },
                    { 15, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "أبرز الأهداف", "أبرز الأهداف", null, false, "goals_top_goals", "الأهداف", null },
                    { 16, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "إدارة الأهداف", "إدارة الأهداف", null, false, "goals_manage_title", "الأهداف", null },
                    { 17, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "قائمة الأهداف", "قائمة الأهداف", null, false, "goals_list_title", "الأهداف", null },
                    { 18, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "رؤيتنا", "رؤيتنا", null, false, "vision_page_title", "الرؤية", null },
                    { 19, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "قسم الرؤية", "قسم الرؤية", null, false, "vision_section_title", "الرؤية", null },
                    { 20, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "أبرز الرؤى", "أبرز الرؤى", null, false, "vision_top_visions", "الرؤية", null },
                    { 21, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "إدارة الرؤية", "إدارة الرؤية", null, false, "vision_manage_title", "الرؤية", null },
                    { 22, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "قائمة الرؤية", "قائمة الرؤية", null, false, "vision_list_title", "الرؤية", null },
                    { 23, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "رسائلنا", "رسائلنا", null, false, "message_page_title", "الرسائل", null },
                    { 24, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "قسم الرسائل", "قسم الرسائل", null, false, "message_section_title", "الرسائل", null },
                    { 25, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "أبرز الرسائل", "أبرز الرسائل", null, false, "message_top_messages", "الرسائل", null },
                    { 26, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "إدارة الرسائل", "إدارة الرسائل", null, false, "message_manage_title", "الرسائل", null },
                    { 27, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "قائمة الرسائل", "قائمة الرسائل", null, false, "message_list_title", "الرسائل", null },
                    { 28, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "الخطط الاستراتيجية", "الخطط الاستراتيجية", null, false, "plans_title", "الخطط", null },
                    { 29, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "وصف الخطط الاستراتيجية", "وصف الخطط الاستراتيجية", null, false, "plans_description", "الخطط", null },
                    { 30, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "مرحلة التحليل", "مرحلة التحليل", null, false, "analysis_title", "التحليل", null },
                    { 31, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "وصف مرحلة التحليل", "وصف مرحلة التحليل", null, false, "analysis_description", "التحليل", null },
                    { 32, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "مرحلة التوجهات", "مرحلة التوجهات", null, false, "direction_title", "التوجهات", null },
                    { 33, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "وصف مرحلة التوجهات", "وصف مرحلة التوجهات", null, false, "direction_description", "التوجهات", null },
                    { 34, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "مرحلة الأهداف", "مرحلة الأهداف", null, false, "objectives_title", "الأهداف الاستراتيجية", null },
                    { 35, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "وصف مرحلة الأهداف", "وصف مرحلة الأهداف", null, false, "objectives_description", "الأهداف الاستراتيجية", null },
                    { 36, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "مرحلة المبادرات", "مرحلة المبادرات", null, false, "initiatives_title", "المبادرات", null },
                    { 37, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "وصف مرحلة المبادرات", "وصف مرحلة المبادرات", null, false, "initiatives_description", "المبادرات", null },
                    { 38, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "مرحلة المشاريع", "مرحلة المشاريع", null, false, "projects_title", "المشاريع", null },
                    { 39, new DateTime(2026, 3, 7, 0, 0, 0, 0, DateTimeKind.Utc), "وصف مرحلة المشاريع", "وصف مرحلة المشاريع", null, false, "projects_description", "المشاريع", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 31);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 32);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 33);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 34);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 35);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 36);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 37);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 38);

            migrationBuilder.DeleteData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 39);

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "التوعية", "التوعية", "home_awareness", "الصفحة الرئيسية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "أهدافنا", "أهدافنا", "home_our_goals", "الصفحة الرئيسية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "رؤيتنا", "رؤيتنا", "home_our_vision", "الصفحة الرئيسية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "رسائلنا", "رسائلنا", "home_our_messages", "الصفحة الرئيسية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "المدونات", "المدونات", "home_blogs", "الصفحة الرئيسية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 9,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "المدونات", "المدونات", "page_blogs", "صفحة المدونات" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 10,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "التوعية", "التوعية", "page_awareness", "صفحة التوعية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 11,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "أهدافنا", "أهدافنا", "page_our_goals", "صفحة الأهداف" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 12,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "رؤيتنا", "رؤيتنا", "page_our_vision", "صفحة الرؤية" });

            migrationBuilder.UpdateData(
                table: "PageTitles",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "CurrentValue", "DefaultValue", "Key", "PageName" },
                values: new object[] { "رسائلنا", "رسائلنا", "page_our_messages", "صفحة الرسائل" });
        }
    }
}
