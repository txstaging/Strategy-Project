using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectsPdfController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;
        private readonly IMapper _mapper;

        // ================= Theme Colors =================
        static readonly string PrimaryColor = "#1565C0";
        static readonly string PrimaryDark = "#0D47A1";
        static readonly string AccentColor = "#2E7D32";
        static readonly string AccentLight = "#E8F5E9";
        static readonly string SurfaceLight = "#E3F2FD";
        static readonly string SurfaceGrey = "#F5F5F5";
        static readonly string GoldAccent = "#F9A825";
        static readonly string TextDark = "#212121";
        static readonly string TextMuted = "#616161";
        static readonly string DividerColor = "#E0E0E0";

        public ProjectsPdfController(ModContext context, ICurrentUserService currentUser, IMapper mapper)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            _context = context;
            _currentUser = currentUser;
            _mapper = mapper;
        }
        [NonAction]
        public async Task<List<PlanProjects>> Index(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goals = await _context.PlanProjects.Where(i => i.PlanId == id).Include(i => i.Units).Include(i => i.User).Include(i => i.Goals).ThenInclude(i => i.Name).Include(i => i.Name).Include(i => i.Initiative).ThenInclude(i=>i.Name).Include(i=>i.Priority).Include(i=>i.Weight).Include(i=>i.Beneficiaries).Include(i=>i.Duration).Include(i=>i.SupervisingAuthority).ToListAsync();
            goals = goals.Where(func.GetFilterProject(Enum.Parse<RoleEnum>(user!.Role!))).ToList();
            return goals;
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GenerateProjectsPdf(int id)
        {
            var logoPath = Path.Combine("wwwroot", "Uploads", "logo.png");
            byte[] logoBytes = System.IO.File.Exists(logoPath)
                ? System.IO.File.ReadAllBytes(logoPath)
                : null;

            var projectsResult = await Index(id);

            var document = Document.Create(container =>
            {
                foreach (var project in projectsResult)
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(2, Unit.Centimetre);
                        page.ContentFromRightToLeft();

                        page.DefaultTextStyle(x =>
                            x.FontFamily("Cairo").FontSize(12).FontColor(TextDark)
                             .DirectionFromRightToLeft()
                        );

                        // ===== Header =====
                        page.Header().ContentFromRightToLeft().Row(row =>
                        {
                            // The logo needs a height of its own. FitHeight inside a
                            // width-only slot has nothing to fit to, so QuestPDF
                            // threw "conflicting size constraints" and every export
                            // of the projects page returned 500 wherever the logo
                            // file exists.
                            if (logoBytes != null)
                                row.ConstantItem(45).Height(45).Image(logoBytes, ImageScaling.FitArea);

                            row.RelativeItem()
                                .AlignMiddle()
                                .AlignCenter()
                                .Text("بيانات المشروع")
                                .FontSize(18)
                                .SemiBold()
                                .FontColor(PrimaryColor)
                                .DirectionFromRightToLeft();
                        });

                        // ===== Content =====
                        page.Content().ContentFromRightToLeft().Column(column =>
                        {
                            column.Item().Height(10);

                            column.Item()
                                .Background(SurfaceLight)
                                .CornerRadius(8)
                                .ContentFromRightToLeft()
                                .Row(cardRow =>
                                {
                                    cardRow.ConstantItem(4).Background(PrimaryColor);
                                    cardRow.RelativeItem().Padding(18).Column(c =>
                                    {
                                        Title(c, project.Name?.Value ?? "-");
                                        Field(c, "رمز المشروع", project.Code);
                                        Field(c, "أولوية المشروع", project.Priority?.Value);
                                        Field(c, "وزن المشروع", project.Weight?.Value);
                                        Field(c, "مدة المشروع", project.Duration?.Value);
                                        Field(c, "تاريخ البداية", project.StartDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture));
                                        Field(c, "تاريخ النهاية", project.EndDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture));
                                        Field(c, "المستفيدون", project.Beneficiaries?.Value);
                                        Field(c, "الجهة المشرفة", project.SupervisingAuthority?.Value);
                                        Field(c, "الهدف المرتبط", project.Goals?.Name?.Value);
                                        Field(c, "المبادرة المرتبطة", project.Initiative?.Name?.Value);
                                    });
                                });
                        });

                        // ===== Footer =====
                        page.Footer().Column(col =>
                        {
                            col.Item().Height(1).Background(DividerColor);
                            col.Item().Height(6);
                            col.Item().Row(row =>
                            {
                                row.RelativeItem().AlignRight().Text(t =>
                                {
                                    t.Span("الخطة الاستراتيجية")
                                        .FontSize(9).FontColor(TextMuted);
                                });
                                row.RelativeItem().AlignCenter().Text(t =>
                                {
                                    t.CurrentPageNumber().FontSize(10).SemiBold().FontColor(PrimaryColor);
                                    t.Span(" / ").FontSize(9).FontColor(TextMuted);
                                    t.TotalPages().FontSize(10).FontColor(TextMuted);
                                });
                                row.RelativeItem().AlignLeft().Text(t =>
                                {
                                    t.Span("Strategic Plan")
                                        .FontSize(9).FontColor(TextMuted).DirectionAuto();
                                });
                            });
                        });
                    });
                }
            });

            return File(document.GeneratePdf(), "application/pdf", "Projects.pdf");
        }

        // ================= Helpers =================

        static void Title(ColumnDescriptor c, string text)
        {
            c.Item().Text(text)
                .FontSize(17)
                .Bold()
                .FontColor(PrimaryColor)
                .DirectionFromRightToLeft();

            c.Item().Height(4);

            // Gold underline
            c.Item().AlignRight().Width(60).Height(3)
                .Background(GoldAccent).CornerRadius(2);

            c.Item().Height(12);
        }

        static void Field(ColumnDescriptor c, string label, string value)
        {
            c.Item().ContentFromRightToLeft().Row(r =>
            {
                r.RelativeItem(1).AlignRight().Text(label)
                    .SemiBold().FontSize(12).FontColor(TextMuted)
                    .DirectionFromRightToLeft();

                r.RelativeItem(2).AlignRight().Text(value ?? "-")
                    .FontSize(12).FontColor(TextDark)
                    .DirectionFromRightToLeft();
            });

            c.Item().Height(4);

            // Subtle divider
            c.Item().Height(1).Background(DividerColor);

            c.Item().Height(6);
        }

        // ================= Fake Data =================

        private List<ProjectModel> GetFakeProjects()
        {
            return new List<ProjectModel>
        {
            new ProjectModel
            {
                ProjectName = "تطوير البنية التحتية الرقمية",
                ProjectCode = "PR-100",
                Priority = "عالية",
                Weight = 40,
                Duration = "18 شهر",
                StartDate = "01-01-2024",
                EndDate = "30-06-2025",
                Beneficiaries = "المواطنون",
                SupervisingEntity = "وزارة الاتصالات",
                LinkedGoal = "التحول الرقمي",
                LinkedInitiative = "مبادرة التحول الرقمي"
            },
            new ProjectModel
            {
                ProjectName = "أتمتة الإجراءات",
                ProjectCode = "PR-101",
                Priority = "متوسطة",
                Weight = 25,
                Duration = "12 شهر",
                StartDate = "01-03-2024",
                EndDate = "01-03-2025",
                Beneficiaries = "الموظفون",
                SupervisingEntity = "وزارة التخطيط",
                LinkedGoal = "تحسين الكفاءة",
                LinkedInitiative = "مبادرة التطوير المؤسسي"
            }
        };
        }
    }

    public class ProjectModel
    {
        public string ProjectName { get; set; }
        public string ProjectCode { get; set; }
        public string Priority { get; set; }
        public int Weight { get; set; }
        public string Duration { get; set; }
        public string StartDate { get; set; }
        public string EndDate { get; set; }
        public string Beneficiaries { get; set; }
        public string SupervisingEntity { get; set; }
        public string LinkedGoal { get; set; }
        public string LinkedInitiative { get; set; }
    }

}

