using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Companion;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Reflection.Metadata;
using System.Threading;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PdfGenratorController : ControllerBase
    {
        // ===== Theme Colors =====
        private static readonly string PrimaryColor = "#1565C0";
        private static readonly string PrimaryDark = "#0D47A1";
        private static readonly string AccentColor = "#2E7D32";
        private static readonly string AccentLight = "#E8F5E9";
        private static readonly string SurfaceLight = "#E3F2FD";
        private static readonly string SurfaceGrey = "#F5F5F5";
        private static readonly string GoldAccent = "#F9A825";
        private static readonly string TextDark = "#212121";
        private static readonly string TextMuted = "#616161";
        private static readonly string DividerColor = "#E0E0E0";

        private readonly IAnalysisPointsService analysisPoints;
        private readonly ICurrentUserService currentUser;
        private readonly ModContext context;

        public PdfGenratorController(IAnalysisPointsService analysisPoints, ICurrentUserService currentUser, ModContext context)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            this.analysisPoints = analysisPoints;
            this.currentUser = currentUser;
            this.context = context;
        }

        private async Task<APIsGenralResponseDto<PlanDirectionDto>> geee(int PlanId)
        {
            var plan = await context.Plans.Where(i => i.Id == PlanId).Include(i => i.PlanDirection).ThenInclude(i => i.DirectionItems).ThenInclude(i => i.DirectionItemsElements).FirstOrDefaultAsync(i => i.Id == PlanId);
            var planDirection = await context.PlanDirection.Where(i => i.Id == plan.PlanDirectionId).Include(i => i.DirectionItems).ThenInclude(i => i.DirectionItemsElements).FirstOrDefaultAsync(i => i.Id == plan.PlanDirectionId);
            var directionitem = await context.DirectionItems.Where(i => i.PlanDirectionId == planDirection.Id).Include(i => i.DirectionItemsElements).ToListAsync();

            var user = await currentUser.GetCurrentUserAsync();
            if (user.Role == RoleEnum.UnitManager.ToString() || user.Role == RoleEnum.UnitEmployee.ToString())
            {
            }
            else if (user.Role == RoleEnum.RegionManager.ToString())
            {
                directionitem = directionitem.Where(p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially).ToList();
            }
            else if (user.Role == RoleEnum.HighManagement.ToString())
            {
                directionitem = directionitem.Where(i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially && i.Status! != ApprovalStatus.ReturnedByUnitManager && i.Status != ApprovalStatus.RejectedByUnitManager).ToList();
            }

            var response = new PlanDirectionDto
            {
                id = planDirection.Id,
                status = ((ApprovalStatus)planDirection.Status).ToString(),
                getAllDirectionDtoResponse = new GetAllDirectionDtoResponse
                {
                    Vision = directionitem
                        .Where(i => i.Type == StrategicDirectionPointType.Vision).OrderByDescending(i => i.Id)
                        .Select(i => new GetAllDirectionDto
                        {
                            Id = i.Id,
                            status = ((ApprovalStatus)i.Status).ToString(),
                            comment = i.Comment,
                            name = i.Name,
                            DirectionItemsElements = i.DirectionItemsElements.Where(func.GetFilter(Enum.Parse<RoleEnum>(user!.Role!))).Select(e => new GetAllDirectionItemElementDto
                            {
                                Id = e.Id,
                                value = e.Name,
                                comment = e.Comment,
                                status = ((ApprovalStatus)e.Status).ToString()
                            }).OrderByDescending(i => i.Id).ToList()
                        }).ToList(),
                    Value = directionitem
                        .Where(i => i.Type == StrategicDirectionPointType.Value).OrderByDescending(i => i.Id)
                        .Select(i => new GetAllDirectionDto
                        {
                            Id = i.Id,
                            status = ((ApprovalStatus)i.Status).ToString(),
                            comment = i.Comment,
                            name = i.Name,
                            DirectionItemsElements = i.DirectionItemsElements.Where(func.GetFilter(Enum.Parse<RoleEnum>(user!.Role!))).Select(e => new GetAllDirectionItemElementDto
                            {
                                Id = e.Id,
                                value = e.Name,
                                comment = e.Comment,
                                status = ((ApprovalStatus)e.Status).ToString()
                            }).OrderByDescending(i => i.Id).ToList()
                        }).ToList(),
                    Message = directionitem
                        .Where(i => i.Type == StrategicDirectionPointType.Message).OrderByDescending(i => i.Id)
                        .Select(i => new GetAllDirectionDto
                        {
                            Id = i.Id,
                            status = ((ApprovalStatus)i.Status).ToString(),
                            comment = i.Comment,
                            name = i.Name,
                            DirectionItemsElements = i.DirectionItemsElements.Where(func.GetFilter(Enum.Parse<RoleEnum>(user!.Role!))).Select(e => new GetAllDirectionItemElementDto
                            {
                                Id = e.Id,
                                value = e.Name,
                                comment = e.Comment,
                                status = ((ApprovalStatus)e.Status).ToString()
                            }).OrderByDescending(i => i.Id).ToList()
                        }).ToList()
                }
            };

            return new APIsGenralResponseDto<PlanDirectionDto>("ok", response);
        }

        // ===== Shared: Enhanced Header =====
        private static void BuildEnhancedHeader(PageDescriptor page, byte[] logoBytes, string title)
        {
            page.Header()
                .ContentFromRightToLeft()
                .Height(120)
                .Column(column =>
                {
                    column.Item().Row(row =>
                    {
                        // Logo on right (RTL)
                        row.ConstantItem(80)
                            .Height(60)
                            .Image(logoBytes);

                        row.RelativeItem()
                            .AlignCenter()
                            .PaddingTop(10)
                            .Text(title)
                            .DirectionFromRightToLeft()
                            .SemiBold()
                            .FontSize(24)
                            .FontColor(Color.FromHex(PrimaryColor));
                    });

                    column.Item().Height(5);

                    // Decorative gold underline
                    column.Item()
                        .AlignCenter()
                        .Width(200)
                        .Height(3)
                        .Background(Color.FromHex(GoldAccent));
                });
        }

        // ===== Shared: Enhanced Footer =====
        private static void BuildEnhancedFooter(PageDescriptor page)
        {
            page.Footer()
                .ContentFromRightToLeft()
                .Column(col =>
                {
                    // Separator line
                    col.Item()
                        .Height(1)
                        .Background(Color.FromHex(DividerColor));

                    col.Item()
                        .PaddingTop(5)
                        .Row(row =>
                        {
                            // Right side (RTL) - Arabic
                            row.RelativeItem()
                                .AlignRight()
                                .Text("الخطة الاستراتيجية")
                                .DirectionFromRightToLeft()
                                .FontSize(9)
                                .FontColor(Color.FromHex(TextMuted));

                            // Center - page number
                            row.RelativeItem()
                                .AlignCenter()
                                .Text(t =>
                                {
                                    t.DefaultTextStyle(s => s.FontSize(9).FontColor(Color.FromHex(TextMuted)).DirectionFromRightToLeft());
                                    t.Span("صفحة ");
                                    t.CurrentPageNumber();
                                    t.Span(" / ");
                                    t.TotalPages();
                                });

                            // Left side - English
                            row.RelativeItem()
                                .AlignLeft()
                                .Text("Strategic Plan")
                                .FontSize(9)
                                .FontColor(Color.FromHex(TextMuted));
                        });
                });
        }

        // ===== Styled HeaderCell =====
        private static int _rowIndex = 0;

        static IContainer StyledHeaderCell(IContainer container)
        {
            return container
                .Background(Color.FromHex(PrimaryColor))
                .PaddingVertical(10)
                .PaddingHorizontal(8)
                .AlignMiddle()
                .AlignCenter();
        }

        static IContainer StyledBodyCell(IContainer container, bool isEven)
        {
            return container
                .Background(isEven ? Color.FromHex(SurfaceGrey) : Colors.White)
                .BorderBottom(1)
                .BorderColor(Color.FromHex(DividerColor))
                .PaddingVertical(10)
                .PaddingHorizontal(8)
                .AlignMiddle()
                .AlignCenter();
        }

        static void AddStyledRow(TableDescriptor table, string col1, string col2, string col3, int rowIdx)
        {
            bool isEven = rowIdx % 2 == 0;
            // RTL order: rightmost column first
            table.Cell().Element(c => StyledBodyCell(c, isEven))
                .Text(col3).DirectionFromRightToLeft().FontSize(13).FontColor(Color.FromHex(TextDark));
            table.Cell().Element(c => StyledBodyCell(c, isEven))
                .Text(col2).DirectionFromRightToLeft().FontSize(13).FontColor(Color.FromHex(TextDark));
            table.Cell().Element(c => StyledBodyCell(c, isEven))
                .Text(col1).DirectionFromRightToLeft().FontSize(13).FontColor(Color.FromHex(TextDark));
        }

        // ========== ENDPOINT 1: Analysis Points PDF ==========
        [HttpGet("pdf/{planid}")]
        public async Task<IActionResult> Pdf(int planid)
        {
            QuestPDF.Settings.EnableDebugging = true;
            var user = await currentUser.GetCurrentUserAsync();

            var streanthResponse = await analysisPoints.GetAll(planid, 1, 5000, "Strength", user);
            var opResponse = await analysisPoints.GetAll(planid, 1, 5000, "Opportunity", user);
            var RiskResponse = await analysisPoints.GetAll(planid, 1, 5000, "Risk", user);
            var ThreatResponse = await analysisPoints.GetAll(planid, 1, 5000, "Threat", user);

            var streanth = streanthResponse.Data;
            var op = opResponse.Data;
            var risk = RiskResponse.Data;
            var Threat = ThreatResponse.Data;
            var logoPath = Path.Combine("wwwroot", "Uploads", "logo.png");
            var logoBytes = System.IO.File.ReadAllBytes(logoPath);

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.ContentFromRightToLeft();

                    page.DefaultTextStyle(x =>
                        x.FontSize(14)
                         .FontFamily("Cairo")
                         .DirectionFromRightToLeft()
                    );

                    // ===== Header =====
                    BuildEnhancedHeader(page, logoBytes, "مرحلة التحليل الاستراتيجي");

                    // ===== Content =====
                    page.Content()
                        .PaddingVertical(10)
                        .Column(column =>
                        {
                            BuildAnalysisTable(column, "القوة", streanth);
                            column.Item().Height(15);
                            BuildAnalysisTable(column, "الفرص", op);
                            column.Item().Height(15);
                            BuildAnalysisTable(column, "الضعف", risk);
                            column.Item().Height(15);
                            BuildAnalysisTable(column, "التهديد", Threat);
                        });

                    // ===== Footer =====
                    BuildEnhancedFooter(page);
                });
            });

            var pdfBytes = document.GeneratePdf();
            return File(pdfBytes, "application/pdf", "report.pdf");
        }

        private static void BuildAnalysisTable(ColumnDescriptor column, string label, dynamic items)
        {
            column.Item().Table(table =>
            {
                // RTL column order: Name (right) | Procedures (center) | Status (left)
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2); // Name (rightmost in RTL)
                    columns.RelativeColumn(5); // Procedures
                    columns.RelativeColumn(2); // Status
                });

                // Table Header - RTL order
                table.Header(header =>
                {
                    header.Cell().Element(StyledHeaderCell)
                        .Text(label).DirectionFromRightToLeft().Bold().FontColor(Colors.White).FontSize(14);
                    header.Cell().Element(StyledHeaderCell)
                        .Text("الاجراءات المتخذة حيالها").DirectionFromRightToLeft().Bold().FontColor(Colors.White).FontSize(14);
                    header.Cell().Element(StyledHeaderCell)
                        .Text("الحالة").DirectionFromRightToLeft().Bold().FontColor(Colors.White).FontSize(14);
                });

                int rowIdx = 0;
                foreach (var item in items)
                {
                    AddStyledRow(table, (string)item.Status, (string)item.Procedures, (string)item.Name, rowIdx);
                    rowIdx++;
                }
            });
        }

        // ========== ENDPOINT 2: Strategic Direction PDF ==========
        [HttpGet("pdff/{id}")]
        public async Task<IActionResult> Pdff(int id)
        {
            QuestPDF.Settings.EnableDebugging = true;

            var logoPath = Path.Combine("wwwroot", "Uploads", "logo.png");
            var logoBytes = System.IO.File.Exists(logoPath)
                ? System.IO.File.ReadAllBytes(logoPath)
                : null;
            var s = await geee(id);

            var values = s.Data.getAllDirectionDtoResponse.Value;
            var valueafter = new List<SectionModel>();
            foreach (var val in values)
            {
                var section = new SectionModel
                {
                    Name = val.name ?? "بدون عنوان",
                    Items = val.DirectionItemsElements.Select(e => e.value).ToList()
                };
                valueafter.Add(section);
            }

            var vision = s.Data.getAllDirectionDtoResponse.Vision;
            var visionafter = new List<SectionModel>();
            foreach (var val in values)
            {
                var section = new SectionModel
                {
                    Name = val.name ?? "بدون عنوان",
                    Items = val.DirectionItemsElements.Select(e => e.value).ToList()
                };
                visionafter.Add(section);
            }

            var mission = s.Data.getAllDirectionDtoResponse.Message;
            var missionafter = new List<SectionModel>();
            foreach (var val in values)
            {
                var section = new SectionModel
                {
                    Name = val.name ?? "بدون عنوان",
                    Items = val.DirectionItemsElements.Select(e => e.value).ToList()
                };
                missionafter.Add(section);
            }

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.ContentFromRightToLeft();

                    page.DefaultTextStyle(x =>
                        x.FontFamily("Cairo").FontSize(14).DirectionFromRightToLeft()
                    );

                    // ===== Header =====
                    if (logoBytes != null)
                    {
                        BuildEnhancedHeader(page, logoBytes, "معلومات التوجه الاستراتيجي");
                    }

                    // ===== Content =====
                    page.Content().Column(column =>
                    {
                        BuildSection(column, "القيم", valueafter, AccentColor, AccentLight);
                        column.Item().Height(20);

                        BuildSection(column, "الرؤية", visionafter, PrimaryColor, SurfaceLight);
                        column.Item().Height(20);

                        BuildSection(column, "الرسالة", missionafter, AccentColor, AccentLight);
                    });

                    // ===== Footer =====
                    BuildEnhancedFooter(page);
                });
            });

            return File(document.GeneratePdf(), "application/pdf", "Strategic_Report.pdf");
        }

        // ===================== Helpers for Endpoint 2 =====================

        void BuildSection(ColumnDescriptor column, string title, List<SectionModel> sections, string accentColorHex, string bgColorHex)
        {
            // Section Title
            column.Item()
                .AlignCenter()
                .PaddingVertical(10)
                .Text(title)
                .DirectionFromRightToLeft()
                .SemiBold()
                .FontSize(20)
                .FontColor(Color.FromHex(accentColorHex));

            foreach (var section in sections)
            {
                // Sub Title with label
                column.Item()
                    .AlignRight()
                    .PaddingTop(10)
                    .Row(row =>
                    {
                        row.AutoItem()
                            .Text("اسم العنصر: ")
                            .DirectionFromRightToLeft()
                            .FontSize(14)
                            .FontColor(Color.FromHex(TextMuted));
                        row.AutoItem()
                            .Text(section.Name)
                            .DirectionFromRightToLeft()
                            .SemiBold()
                            .FontSize(16)
                            .FontColor(Color.FromHex(TextDark));
                    });

                column.Item().Height(5);

                foreach (var item in section.Items)
                {
                    column.Item().Element(c => BuildCard(c, item, accentColorHex, bgColorHex));
                    column.Item().Height(8);
                }
            }
        }

        void BuildCard(IContainer container, string text, string accentColorHex, string bgColorHex)
        {
            container
                .Background(Color.FromHex(bgColorHex))
                .Padding(10)
                .Row(row =>
                {
                    // Right-side accent border (4px colored bar) - appears on right in RTL
                    row.ConstantItem(4)
                        .Background(Color.FromHex(accentColorHex));

                    row.ConstantItem(8); // spacing

                    row.RelativeItem()
                        .AlignRight()
                        .Text(text)
                        .DirectionFromRightToLeft()
                        .FontSize(14)
                        .FontColor(Color.FromHex(TextDark));
                });
        }

        // ===================== Models =====================

        public class SectionModel
        {
            public string Name { get; set; }
            public List<string> Items { get; set; }
        }

        // ========== ENDPOINT 3: Goals PDF ==========
        [HttpGet("goals-pdf/{planid}")]
        public async Task<IActionResult> GenerateGoalsPdf(int planid)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            QuestPDF.Settings.EnableDebugging = false;
            var goalss = await context.PlanGoals.Where(i => i.PlanId == planid).Include(i => i.AnalysisPoints).Include(i => i.Units).Include(i => i.User).Include(i => i.Indicator).Include(i => i.Descripition).Include(i => i.Indicator).Include(i => i.Name).ToListAsync();

            var logoPath = Path.Combine("wwwroot", "Uploads", "logo.png");
            var logoBytes = System.IO.File.Exists(logoPath)
                ? System.IO.File.ReadAllBytes(logoPath)
                : null;

            var goals = new List<GoalModel>();
            foreach (var goal in goalss)
            {
                goals.Add(new GoalModel
                {
                    Code = goal.Id.ToString(),
                    Title = goal.Name.Value,
                    Indicator = goal.Indicator.Value,
                    ResponsibleEntity = goal.Descripition.Value,
                    TimeFrame = "",
                    Strengths = goal.AnalysisPoints
                        .Where(i => i.Type == AnalysisPointsType.Strength)
                        .Select(i => i.Name)
                        .ToList(),
                    Opportunities = goal.AnalysisPoints
                        .Where(i => i.Type == AnalysisPointsType.Opportunity)
                        .Select(i => i.Name)
                        .ToList(),
                    Threats = goal.AnalysisPoints
                        .Where(i => i.Type == AnalysisPointsType.Threat)
                        .Select(i => i.Name)
                        .ToList(),
                    Weaknesses = goal.AnalysisPoints
                        .Where(i => i.Type == AnalysisPointsType.Risk)
                        .Select(i => i.Name)
                        .ToList(),
                });
            }

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                foreach (var goal in goals)
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(2, Unit.Centimetre);
                        page.PageColor(Colors.White);
                        page.ContentFromRightToLeft();

                        page.DefaultTextStyle(x =>
                            x.FontFamily("Cairo")
                             .FontSize(13)
                             .DirectionFromRightToLeft()
                        );

                        // ===== Header =====
                        if (logoBytes != null)
                        {
                            BuildEnhancedHeader(page, logoBytes, "الأهداف الاستراتيجية");
                        }
                        else
                        {
                            page.Header()
                                .ContentFromRightToLeft()
                                .Height(60)
                                .AlignCenter()
                                .Text("الأهداف الاستراتيجية")
                                .DirectionFromRightToLeft()
                                .SemiBold()
                                .FontSize(24)
                                .FontColor(Color.FromHex(PrimaryColor));
                        }

                        // ===== Content =====
                        page.Content().Column(column =>
                        {
                            // ===== Goal Title with card style =====
                            column.Item()
                                .Background(Color.FromHex(SurfaceLight))
                                .Padding(12)
                                .Row(row =>
                                {
                                    row.ConstantItem(4)
                                        .Background(Color.FromHex(PrimaryColor));
                                    row.ConstantItem(8);
                                    row.RelativeItem()
                                        .AlignRight()
                                        .Column(col =>
                                        {
                                            col.Item().Text("اسم الهدف:")
                                                .DirectionFromRightToLeft()
                                                .FontSize(12)
                                                .FontColor(Color.FromHex(TextMuted));
                                            col.Item().Text(goal.Title)
                                                .DirectionFromRightToLeft()
                                                .SemiBold()
                                                .FontSize(18)
                                                .FontColor(Color.FromHex(TextDark));
                                        });
                                });

                            column.Item().Height(10);

                            // ===== Goal Info Table =====
                            column.Item().Table(table =>
                            {
                                table.ColumnsDefinition(cols =>
                                {
                                    cols.RelativeColumn(); // Value (right in RTL)
                                    cols.RelativeColumn(); // Label
                                });

                                BuildStyledInfoRow(table, "كود الهدف", goal.Code);
                                BuildStyledInfoRow(table, "المؤشر", goal.Indicator);
                                BuildStyledInfoRow(table, "الجهة المسؤولة", goal.ResponsibleEntity);
                            });

                            column.Item().Height(15);

                            // ===== SWOT Tags =====
                            BuildStyledTags(column, "نقاط القوة", goal.Strengths, AccentColor, AccentLight);
                            BuildStyledTags(column, "الفرص", goal.Opportunities, PrimaryColor, SurfaceLight);
                            BuildStyledTags(column, "التهديدات", goal.Threats, "#C62828", "#FFEBEE");
                            BuildStyledTags(column, "نقاط الضعف", goal.Weaknesses, GoldAccent, "#FFF8E1");
                        });

                        // ===== Footer =====
                        BuildEnhancedFooter(page);
                    });
                }
            });

            var pdfBytes = document.GeneratePdf();
            return File(pdfBytes, "application/pdf", "Strategic_Goals.pdf");
        }

        // ================= Helpers for Goals PDF =================

        static void BuildStyledInfoRow(TableDescriptor table, string title, string value)
        {
            // RTL: value on right column, label on left column
            table.Cell()
                .Background(Color.FromHex(SurfaceLight))
                .BorderBottom(1)
                .BorderColor(Color.FromHex(DividerColor))
                .PaddingVertical(8)
                .PaddingHorizontal(10)
                .AlignRight()
                .Text(title)
                .DirectionFromRightToLeft()
                .SemiBold()
                .FontColor(Color.FromHex(TextMuted));

            table.Cell()
                .BorderBottom(1)
                .BorderColor(Color.FromHex(DividerColor))
                .PaddingVertical(8)
                .PaddingHorizontal(10)
                .AlignRight()
                .Text(value)
                .DirectionFromRightToLeft()
                .FontColor(Color.FromHex(TextDark));
        }

        static void BuildStyledTags(ColumnDescriptor column, string title, List<string> items, string colorHex, string bgHex)
        {
            if (items == null || !items.Any())
                return;

            column.Item()
                .AlignRight()
                .Text(title)
                .DirectionFromRightToLeft()
                .SemiBold()
                .FontSize(15)
                .FontColor(Color.FromHex(colorHex));

            column.Item().Height(5);

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(c =>
                {
                    c.RelativeColumn();
                    c.RelativeColumn();
                    c.RelativeColumn();
                });

                foreach (var item in items)
                {
                    table.Cell()
                        .Padding(4)
                        .Background(Color.FromHex(bgHex))
                        .Border(1)
                        .BorderColor(Color.FromHex(colorHex))
                        .PaddingVertical(6)
                        .PaddingHorizontal(10)
                        .AlignCenter()
                        .Text(item)
                        .DirectionFromRightToLeft()
                        .FontColor(Color.FromHex(colorHex))
                        .FontSize(11)
                        .SemiBold();
                }
            });

            column.Item().Height(12);
        }

        static List<string> GenerateList(string prefix, int count)
        {
            var list = new List<string>();
            for (int i = 1; i <= count; i++)
                list.Add($"{prefix} رقم {i}");
            return list;
        }
    }

    // ================= Models =================

    public class GoalModel
    {
        public string Code { get; set; }
        public string Title { get; set; }
        public string Indicator { get; set; }
        public string ResponsibleEntity { get; set; }
        public string TimeFrame { get; set; }

        public List<string> Strengths { get; set; } = new();
        public List<string> Opportunities { get; set; } = new();
        public List<string> Threats { get; set; } = new();
        public List<string> Weaknesses { get; set; } = new();
    }
}
