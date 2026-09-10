using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StrategicPlanPdfGenerator : Controller
    {
        // ================= THEME COLORS =================
        private const string PrimaryColor = "#1565C0";
        private const string PrimaryDark = "#0D47A1";
        private const string AccentColor = "#2E7D32";
        private const string AccentLight = "#E8F5E9";
        private const string SurfaceLight = "#E3F2FD";
        private const string SurfaceGrey = "#F5F5F5";
        private const string GoldAccent = "#F9A825";
        private const string TextDark = "#212121";
        private const string TextMuted = "#616161";
        private const string DividerColor = "#E0E0E0";

        private int _stageNumber = 0;

        public StrategicPlanPdfGenerator()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        private byte[] Generate()
        {
            QuestPDF.Settings.License = LicenseType.Community;
            _stageNumber = 0;

            return Document.Create(container =>
            {
                // ================= COVER =================
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontFamily("Cairo").FontSize(13).FontColor(TextDark)
                        .DirectionFromRightToLeft());
                    page.ContentFromRightToLeft();

                    page.Content().AlignMiddle().AlignCenter().Column(col =>
                    {
                        col.Item().Text("الخطة الاستراتيجية")
                            .FontSize(32).Bold().FontColor(PrimaryColor)
                            .DirectionFromRightToLeft();
                    });
                });

                // ================= ANALYSIS =================
                AddStageTitle(container, "التحليل الاستراتيجي");
                AddAnalysis(container);

                // ================= DIRECTION =================
                AddStageTitle(container, "التوجه الاستراتيجي");
                AddDirectionSection(container, "القيم المؤسسية", new[] { "الشفافية", "الجودة", "العمل الجماعي" });
                AddDirectionSection(container, "الرؤية", new[] { "الريادة", "التميز المؤسسي" });
                AddDirectionSection(container, "الرسالة", new[] { "تحقيق رضا المستفيد", "تحسين الأداء" });

                // ================= GOALS =================
                AddStageTitle(container, "الأهداف الاستراتيجية");
                for (int g = 1; g <= 3; g++)
                {
                    var goalIndex = g;
                    container.Page(page =>
                    {
                        ApplyPageDefaults(page);

                        page.Footer().Element(c => BuildFooter(c));

                        page.Content().ContentFromRightToLeft().Column(col =>
                        {
                            col.Item().ContentFromRightToLeft().Row(row =>
                            {
                                row.AutoItem().Width(5).Height(24).Background(AccentColor).CornerRadius(2);
                                row.AutoItem().Width(8);
                                row.RelativeItem().AlignRight().AlignMiddle()
                                    .Text($"الهدف رقم {goalIndex}").FontSize(22).Bold().FontColor(AccentColor)
                                    .DirectionFromRightToLeft();
                            });

                            col.Item().Height(6);
                            col.Item().AlignRight().Text("وصف الهدف الاستراتيجي")
                                .FontSize(14).FontColor(TextMuted)
                                .DirectionFromRightToLeft();

                            col.Item().PaddingTop(10);
                            BuildInitiatives(col);
                        });
                    });
                }
            }).GeneratePdf();
        }

        // ================= PAGE DEFAULTS =================
        void ApplyPageDefaults(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.Margin(2, Unit.Centimetre);
            page.DefaultTextStyle(x => x.FontFamily("Cairo").FontSize(13).FontColor(TextDark)
                .DirectionFromRightToLeft());
            page.ContentFromRightToLeft();
        }

        // ================= FOOTER =================
        void BuildFooter(IContainer container)
        {
            container.Column(col =>
            {
                col.Item().Height(1).Background(DividerColor);
                col.Item().Height(6);
                col.Item().ContentFromRightToLeft().Row(row =>
                {
                    row.RelativeItem().AlignRight().Text("الخطة الاستراتيجية")
                        .FontSize(9).FontColor(TextMuted).DirectionFromRightToLeft();

                    row.RelativeItem().AlignCenter().Text(t =>
                    {
                        t.CurrentPageNumber().FontSize(9).FontColor(TextMuted);
                        t.Span(" / ").FontSize(9).FontColor(TextMuted);
                        t.TotalPages().FontSize(9).FontColor(TextMuted);
                    });

                    row.RelativeItem().AlignLeft().Text("Strategic Plan")
                        .FontSize(9).FontColor(TextMuted);
                });
            });
        }

        // ================= HELPERS =================
        void AddStageTitle(IDocumentContainer container, string title)
        {
            _stageNumber++;
            var stageNum = _stageNumber;

            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontFamily("Cairo").FontSize(13).FontColor(TextDark)
                    .DirectionFromRightToLeft());
                page.ContentFromRightToLeft();

                page.Footer().Element(c => BuildFooter(c));

                page.Content().AlignMiddle().AlignCenter().Column(col =>
                {
                    // Numbered circle badge
                    col.Item().AlignCenter().Width(60).Height(60)
                        .Background(PrimaryColor)
                        .CornerRadius(30)
                        .AlignMiddle().AlignCenter()
                        .Text(stageNum.ToString())
                        .FontSize(26).Bold().FontColor(Colors.White);

                    col.Item().Height(16);

                    col.Item().Text(title)
                        .FontSize(28).Bold().FontColor(PrimaryDark)
                        .DirectionFromRightToLeft();

                    col.Item().Height(8);

                    // Gold underline
                    col.Item().AlignCenter().Width(80).Height(4)
                        .Background(GoldAccent)
                        .CornerRadius(2);
                });
            });
        }

        void AddAnalysis(IDocumentContainer container)
        {
            container.Page(page =>
            {
                ApplyPageDefaults(page);
                page.Footer().Element(c => BuildFooter(c));

                page.Content().ContentFromRightToLeft().Column(col =>
                {
                    BuildSimpleTable(col, "نقاط القوة");
                    BuildSimpleTable(col, "نقاط الضعف");
                    BuildSimpleTable(col, "الفرص");
                    BuildSimpleTable(col, "التهديدات");
                });
            });
        }

        void AddDirectionSection(IDocumentContainer container, string title, IEnumerable<string> items)
        {
            container.Page(page =>
            {
                ApplyPageDefaults(page);
                page.Footer().Element(c => BuildFooter(c));

                page.Content().ContentFromRightToLeft().Column(col =>
                {
                    // Section title with right-side accent border (RTL)
                    col.Item().ContentFromRightToLeft().Row(row =>
                    {
                        row.AutoItem().Width(4).Height(28).Background(AccentColor).CornerRadius(2);
                        row.AutoItem().Width(8);
                        row.RelativeItem().AlignRight().AlignMiddle()
                            .Text(title).FontSize(24).Bold().FontColor(AccentColor)
                            .DirectionFromRightToLeft();
                    });

                    col.Item().PaddingTop(10);

                    foreach (var item in items)
                    {
                        // Card with right-side accent border
                        col.Item().PaddingBottom(8).ContentFromRightToLeft().Row(row =>
                        {
                            row.AutoItem().Width(4).Background(PrimaryColor).CornerRadius(2);
                            row.AutoItem().Width(8);
                            row.RelativeItem()
                                .Background(SurfaceLight)
                                .Padding(14)
                                .ContentFromRightToLeft()
                                .AlignRight()
                                .Text(item).FontSize(14).FontColor(TextDark)
                                .DirectionFromRightToLeft();
                        });
                    }
                });
            });
        }

        void BuildInitiatives(ColumnDescriptor col)
        {
            for (int i = 1; i <= 2; i++)
            {
                var idx = i;
                // Card with right-side accent border (RTL)
                col.Item().PaddingBottom(10).ContentFromRightToLeft().Row(outerRow =>
                {
                    outerRow.AutoItem().Width(4).Background(AccentColor).CornerRadius(2);
                    outerRow.AutoItem().Width(6);
                    outerRow.RelativeItem()
                        .Background(AccentLight)
                        .Padding(14)
                        .ContentFromRightToLeft()
                        .Column(c =>
                        {
                            c.Item().AlignRight().Text(t =>
                            {
                                t.Span("اسم المبادرة: ").FontSize(13).SemiBold()
                                    .FontColor(TextMuted).DirectionFromRightToLeft();
                                t.Span($"مبادرة {idx}").FontSize(15).SemiBold()
                                    .FontColor(AccentColor).DirectionFromRightToLeft();
                            });

                            c.Item().Height(4);
                            c.Item().AlignRight().Text("حالة المبادرة: قيد التنفيذ")
                                .FontSize(12).FontColor(TextDark).DirectionFromRightToLeft();
                            c.Item().AlignRight().Text("الشركاء: وزارة - جهة داعمة")
                                .FontSize(12).FontColor(TextDark).DirectionFromRightToLeft();

                            c.Item().PaddingTop(8);
                            BuildProjectsTable(c);
                        });
                });
            }
        }

        void BuildProjectsTable(ColumnDescriptor col)
        {
            col.Item().ContentFromRightToLeft().Table(table =>
            {
                // RTL order: right column first for Arabic reading
                table.ColumnsDefinition(c =>
                {
                    c.RelativeColumn(2);  // الحالة (right)
                    c.RelativeColumn(4);  // اسم المشروع
                    c.RelativeColumn(1);  // # (left)
                });

                table.Header(h =>
                {
                    h.Cell().Element(StyledHeaderCell).Text("الحالة");
                    h.Cell().Element(StyledHeaderCell).Text("اسم المشروع");
                    h.Cell().Element(StyledHeaderCell).Text("#");
                });

                for (int p = 1; p <= 3; p++)
                {
                    var pVal = p;
                    bool alt = p % 2 == 0;
                    table.Cell().Element(c => StyledBodyCell(c, "نشط", alt));
                    table.Cell().Element(c => StyledBodyCell(c, $"مشروع {pVal}", alt));
                    table.Cell().Element(c => StyledBodyCell(c, pVal.ToString(), alt));
                }
            });
        }

        void BuildSimpleTable(ColumnDescriptor col, string title)
        {
            col.Item().AlignRight().Text(title).Bold().FontColor(PrimaryColor)
                .DirectionFromRightToLeft();

            col.Item().ContentFromRightToLeft().Table(table =>
            {
                // RTL order: right column first
                table.ColumnsDefinition(c =>
                {
                    c.RelativeColumn(6);  // الوصف (right)
                    c.RelativeColumn(1);  // # (left)
                });

                table.Header(h =>
                {
                    h.Cell().Element(StyledHeaderCell).Text("الوصف");
                    h.Cell().Element(StyledHeaderCell).Text("#");
                });

                for (int i = 1; i <= 3; i++)
                {
                    var iVal = i;
                    bool alt = i % 2 == 0;
                    table.Cell().Element(c => StyledBodyCell(c, $"{title} عنصر {iVal}", alt));
                    table.Cell().Element(c => StyledBodyCell(c, iVal.ToString(), alt));
                }
            });

            col.Item().Height(15);
        }

        // ================= CELL STYLES =================
        IContainer StyledHeaderCell(IContainer container) =>
            container
                .Background(PrimaryColor)
                .PaddingVertical(10)
                .PaddingHorizontal(8)
                .AlignCenter()
                .AlignMiddle()
                .DefaultTextStyle(x => x.FontColor(Colors.White).Bold().FontSize(12)
                    .DirectionFromRightToLeft());

        void StyledBodyCell(IContainer container, string text, bool alternate)
        {
            container
                .Background(alternate ? SurfaceGrey : Colors.White)
                .BorderBottom(1)
                .BorderColor(DividerColor)
                .PaddingVertical(8)
                .PaddingHorizontal(8)
                .AlignCenter()
                .AlignMiddle()
                .Text(text ?? "-")
                    .FontSize(11).FontColor(TextDark)
                    .DirectionFromRightToLeft();
        }

        [HttpGet("strategic-plan-pdf")]
        public IActionResult GenerateApi()
        {
            var generator = new StrategicPlanPdfGenerator();
            var pdf = generator.Generate();

            return File(pdf, "application/pdf", "StrategicPlan.pdf");
        }

        // ---------------- COVER ----------------
        void BuildCover(IDocumentContainer container)
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontFamily("Cairo").FontSize(13).FontColor(TextDark)
                    .DirectionFromRightToLeft());
                page.ContentFromRightToLeft();

                page.Content().AlignMiddle().AlignCenter().Column(col =>
                {
                    col.Item().Height(120).Placeholder(); // LOGO
                    col.Item().Height(20);
                    col.Item().Text("الخطة الاستراتيجية")
                        .FontSize(28).Bold().FontColor(PrimaryColor)
                        .DirectionFromRightToLeft();
                });
            });
        }

        // ---------------- ANALYSIS (TABLES) ----------------
        void BuildAnalysis(IDocumentContainer container)
        {
            container.Page(page =>
            {
                ApplyPageDefaults(page);
                page.Footer().Element(c => BuildFooter(c));

                page.Content().ContentFromRightToLeft().Column(col =>
                {
                    BuildSimpleTable(col, "نقاط القوة");
                    col.Item().Height(15);
                    BuildSimpleTable(col, "نقاط الضعف");
                    col.Item().Height(15);
                    BuildSimpleTable(col, "الفرص");
                    col.Item().Height(15);
                    BuildSimpleTable(col, "التهديدات");
                });
            });
        }

        // ---------------- DIRECTION ----------------
        void BuildDirection(IDocumentContainer container)
        {
            container.Page(page =>
            {
                ApplyPageDefaults(page);
                page.Footer().Element(c => BuildFooter(c));

                page.Content().ContentFromRightToLeft().Column(col =>
                {
                    BuildCardSection(col, "القيم", "النزاهة - الشفافية - الابتكار");
                    col.Item().Height(20);
                    BuildCardSection(col, "الرؤية", "تحقيق تنمية مستدامة وشاملة");
                    col.Item().Height(20);
                    BuildCardSection(col, "الرسالة", "خدمة المجتمع بكفاءة وجودة");
                });
            });
        }

        // ---------------- GOALS / INITIATIVES / PROJECTS ----------------
        void BuildGoals(IDocumentContainer container)
        {
            foreach (var goal in FakeData.Goals)
            {
                container.Page(page =>
                {
                    ApplyPageDefaults(page);
                    page.Footer().Element(c => BuildFooter(c));

                    page.Content().ContentFromRightToLeft().Column(col =>
                    {
                        GoalCard(col.Item(), goal.Name);
                        col.Item().Height(15);

                        foreach (var initiative in goal.Initiatives)
                        {
                            InitiativeCard(col.Item(), initiative.Name);
                            col.Item().Height(10);
                            ProjectsTable(col.Item(), initiative.Projects);
                            col.Item().Height(20);
                        }
                    });
                });
            }
        }

        // ---------------- COMPONENTS ----------------

        void BuildCardSection(ColumnDescriptor col, string title, string text)
        {
            col.Item().ContentFromRightToLeft().Row(row =>
            {
                row.AutoItem().Width(4).Height(28).Background(PrimaryColor).CornerRadius(2);
                row.AutoItem().Width(8);
                row.RelativeItem().AlignRight().AlignMiddle()
                    .Text(title).Bold().FontSize(18).FontColor(PrimaryDark)
                    .DirectionFromRightToLeft();
            });
            col.Item().Height(5);

            col.Item().ContentFromRightToLeft().Row(row =>
            {
                row.AutoItem().Width(4).Background(PrimaryColor).CornerRadius(2);
                row.AutoItem().Width(6);
                row.RelativeItem()
                    .Background(SurfaceLight)
                    .Padding(14)
                    .ContentFromRightToLeft()
                    .AlignRight()
                    .Text(text).FontSize(14).FontColor(TextDark)
                    .DirectionFromRightToLeft();
            });
        }

        void GoalCard(IContainer container, string text)
        {
            container.ContentFromRightToLeft().Row(row =>
            {
                row.AutoItem().Width(5).Height(24).Background(PrimaryColor).CornerRadius(2);
                row.AutoItem().Width(8);
                row.RelativeItem()
                    .Background(SurfaceLight)
                    .Padding(14)
                    .ContentFromRightToLeft()
                    .AlignRight()
                    .Text(text).Bold().FontSize(16).FontColor(PrimaryColor)
                    .DirectionFromRightToLeft();
            });
        }

        void InitiativeCard(IContainer container, string text)
        {
            container.ContentFromRightToLeft().Row(row =>
            {
                row.AutoItem().Width(4).Background(AccentColor).CornerRadius(2);
                row.AutoItem().Width(6);
                row.RelativeItem()
                    .Background(AccentLight)
                    .Padding(12)
                    .ContentFromRightToLeft()
                    .AlignRight()
                    .Text(text).Bold().FontSize(14).FontColor(AccentColor)
                    .DirectionFromRightToLeft();
            });
        }

        void ProjectsTable(IContainer container, List<string> projects)
        {
            container.ContentFromRightToLeft().Table(table =>
            {
                // RTL order: right column first
                table.ColumnsDefinition(c =>
                {
                    c.RelativeColumn();   // المشروع (right)
                    c.ConstantColumn(40); // # (left)
                });

                table.Header(h =>
                {
                    h.Cell().Element(StyledHeaderCell).Text("المشروع");
                    h.Cell().Element(StyledHeaderCell).Text("#");
                });

                int i = 1;
                foreach (var p in projects)
                {
                    var pVal = p;
                    var iVal = i;
                    bool alt = i % 2 == 0;
                    table.Cell().Element(c => StyledBodyCell(c, pVal, alt));
                    table.Cell().Element(c => StyledBodyCell(c, iVal.ToString(), alt));
                    i++;
                }
            });
        }
    }

    // ---------------- FAKE DATA ----------------
    static class FakeData
    {
        public static List<Goal> Goals => new()
        {
            new Goal
            {
                Name = "تحسين جودة الخدمات",
                Initiatives = new()
                {
                    new Initiative
                    {
                        Name = "تطوير البنية التحتية",
                        Projects = new() { "مشروع 1", "مشروع 2" }
                    }
                }
            }
        };
    }

    class Goal
    {
        public string Name { get; set; }
        public List<Initiative> Initiatives { get; set; }
    }

    class Initiative
    {
        public string Name { get; set; }
        public List<string> Projects { get; set; }
    }
}
