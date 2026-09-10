using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata;
using Mod.Core.Entities.Initiative;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class intiController1 : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;
        public intiController1(ModContext context, ICurrentUserService currentUser)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            _context = context;
            _currentUser = currentUser;
        }
        [NonAction]
        private  async Task <List<PlanInitiative>> ddd(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goals = await _context.PlanInitiatives.Where(i => i.PlanId == id).Include(i => i.InitiativeKpis).Include(i => i.Name).Include(i => i.Unit).Include(i => i.User).Include(i => i.InitiativeItems).Include(i => i.Goal).ThenInclude(i => i.Name).ToListAsync();
            goals = goals.Where(func.GetFilterInitiative(Enum.Parse<RoleEnum>(user!.Role!))).ToList();
            return goals;
        }
        static IContainer SectionCard(IContainer container)
        {
            return container
                .Border(1)
                .BorderColor(Colors.Grey.Lighten2)
                .Background(Colors.Grey.Lighten5)
                .Padding(12)
                .CornerRadius(6);
        }

        static IContainer HeaderCell(IContainer container)
        {
            return container
                .Background(Colors.Blue.Lighten4)
                .Padding(6)
                .AlignCenter()
                .AlignMiddle()
                .Border(1)
                .BorderColor(Colors.Blue.Lighten2);
        }

        static IContainer BodyCell(IContainer container)
        {
            return container
                .Padding(6)
                .Border(1)
                .BorderColor(Colors.Grey.Lighten2);
        }
        
        [HttpGet("initiatives-pdf/{id}")]
        public async Task< IActionResult> GenerateInitiativesPdf(int id)
        {
            var logoPath = Path.Combine("wwwroot", "Uploads", "logo.png");
            var logoBytes = System.IO.File.Exists(logoPath)
                ? System.IO.File.ReadAllBytes(logoPath)
                : null;

            // Fetch initiatives and ensure the result is extracted from ActionResult  
            var initiativeResult = await ddd(id);
           

            var document = Document.Create(container =>
            {
                foreach (var initiative in initiativeResult)
                {
                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4);
                        page.Margin(2, Unit.Centimetre);
                        page.PageColor(Colors.White);

                        page.DefaultTextStyle(x =>
                            x.FontFamily("Cairo")
                             .FontSize(13)
                        );

                        // ===== Header =====  
                        page.Header().Row(row =>
                        {
                            row.RelativeItem()
                                .AlignMiddle()
                                .AlignCenter()
                                .Text("بطاقة المبادرة")
                                .FontSize(20)
                                .SemiBold()
                                .FontColor(Colors.Blue.Darken2);
                        });

                        // ===== Content =====  
                        page.Content().Column(column =>
                        {
                            // ===== Initiative Info =====  
                            column.Item().Element(SectionCard).Column(c =>
                            {
                                c.Item().Text($"اسم المبادرة: {initiative.Name.Value}")
                                    .SemiBold()
                                    .FontSize(15);

                                c.Item().Text($"الحالة العامة: {initiative.Status}")
                                    .FontColor(Colors.Grey.Darken1);
                            });

                            column.Item().Height(15);

                            // ===== Goals =====  
                            column.Item().Element(SectionCard).Column(c =>
                            {
                                c.Item().Text("الأهداف المرتبطة")
                                    .SemiBold()
                                    .FontSize(14);

                               
                                    c.Item().Text($"• {initiative.Goal.Name.Value}");
                            });

                            column.Item().Height(15);

                            // ===== KPIs (Names only) =====  
                            column.Item().Element(SectionCard).Column(c =>
                            {
                                c.Item().Text("مؤشرات الأداء")
                                    .SemiBold()
                                    .FontSize(14);

                                foreach (var kpi in initiative.InitiativeKpis)
                                    c.Item().Text($"• {kpi.Value}");
                            });

                            column.Item().Height(15);

                            // ===== Partners =====  
                            column.Item().Element(SectionCard).Column(c =>
                            {
                                c.Item().Text("شركاء التنفيذ")
                                    .SemiBold()
                                    .FontSize(14);

                                foreach (var partner in initiative.InitiativeItems)
                                    c.Item().Text($"• {partner.Value}");
                            });
                        });

                        // ===== Footer =====  
                        page.Footer().AlignCenter().Text(t =>
                        {
                            t.Span("صفحة ");
                            t.CurrentPageNumber();
                            t.Span(" من ");
                            t.TotalPages();
                        });
                    });
                }
            });

            var pdfBytes = document.GeneratePdf();
            return File(pdfBytes, "application/pdf", "Initiatives.pdf");
        }

        private List<InitiativeModel> GetFakeInitiatives()
        {
            return new List<InitiativeModel>
    {
        new InitiativeModel
        {
            Name = "مبادرة التحول الرقمي",
            Status = "قيد التنفيذ",

            Goals = new List<string>
            {
                "رفع كفاءة الخدمات",
                "تحسين تجربة المستفيد",
                "تقليل الإجراءات الورقية"
            },

            Kpis = new List<KpiModel>
            {
                new KpiModel
                {
                    Name = "نسبة الخدمات الرقمية",
                  
                },
                new KpiModel
                {
                    Name = "زمن تقديم الخدمة",
                   
                }
            },

            Partners = new List<string>
            {
                "وزارة الاتصالات",
                "شركة تطوير",
                "فريق التحول الرقمي"
            }
        },

        new InitiativeModel
        {
            Name = "مبادرة رفع كفاءة الموارد البشرية",
            Status = "مكتملة",

            Goals = new List<string>
            {
                "تحسين الأداء الوظيفي",
                "زيادة رضا الموظفين"
            },

            Kpis = new List<KpiModel>
            {
                 new KpiModel { Name = "نسبة الخدمات الرقمية" },
                 new KpiModel { Name = "زمن تقديم الخدمة" }

            },
           
               
            


            Partners = new List<string>
            {
                "إدارة الموارد البشرية",
                "مركز التدريب"
            }
        }
    };
        }

        public class InitiativeModel
        {
            public string Name { get; set; }
            public string Status { get; set; }

            public List<string> Goals { get; set; } = new();
            public List<KpiModel> Kpis { get; set; } = new();
            public List<string> Partners { get; set; } = new();
        }
        public class KpiModel
        {
            public string Name { get; set; }
        }



    }
}
