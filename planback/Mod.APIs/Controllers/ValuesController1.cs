using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Mod.Core.Entities.Initiative;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;
using static Mod.APIs.FullReport;

namespace Mod.APIs.Controllers
{
    [ApiController]
    [Route("api/pdf")]
    public class Values : ControllerBase
    {
        private readonly ModContext context;
        private readonly ICurrentUserService currentUser;

        public Values(ModContext context,ICurrentUserService currentUser)
        {
            QuestPDF.Settings.License = LicenseType.Community;
            this.context = context;
            this.currentUser = currentUser;
        }
        [NonAction]
        public List<TableRow> Get(int planid)
        {
            var goals = context.PlanGoals.Where(i => i.PlanId == planid).Include(i => i.Indicator).Include(i => i.Descripition).Include(i => i.Name).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeKpis).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeItems).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Name).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Duration).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Beneficiaries).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.SupervisingAuthority).Include(i => i.PlanInitiatives).ThenInclude(i => i.Name).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeItems).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.PlanProjects).ThenInclude(i=>i.Priority).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.PlanProjects).ThenInclude(i=>i.Percentage).ToList();
            var list = new List<TableRow>();
            foreach (var item in goals)
            {
                foreach (var initiative in item.PlanInitiatives)
                {
                    foreach (var project in initiative.PlanProjects)
                    {
                        // A new row per project (the previous code reused one row per
                        // goal, so every row showed the last project's data).
                        var x = new TableRow()
                        {
                            goal = item.Name.Value,
                            initiative = initiative.Name.Value,
                            project = project.Name.Value,
                            priority = project.Priority.Value,
                            startdate = project.StartDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
                            enddate = project.EndDate.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture),
                            percentage = project.Percentage?.Value ?? "0",
                        };
                        list.Add(x);
                    }
                }
            }
            return list;
        }

        [NonAction]
        public List<StrategicGoal> GetTotalGoal(int planid)
        {
            var goals = context.PlanGoals.Where(i => i.PlanId == planid).Include(i=>i.Indicator).Include(i=>i.Descripition).Include(i=>i.Name).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeKpis).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeItems).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Name).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Duration).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Beneficiaries).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.SupervisingAuthority).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.Name).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.InitiativeItems).ToList();
            var list = new List<StrategicGoal>();
            foreach (var item in goals)
            {
                var c = new StrategicGoal()
                {
                    Name = item.Name.Value,
                    Description = item.Descripition.Value,
                    main = item.Indicator.Value,
                    Initiatives = new List<StrategicInitiative>()








                };
                foreach (var itemm in item.PlanInitiatives)
                {
                    var owner = itemm.InitiativeItems.Where(i => i.Type == Core.Entities.Initiative.InitiativeItemType.AdminInCharge).FirstOrDefault();

                    var r = new StrategicInitiative()
                    {
                        Name = itemm.Name.Value,
                        Owner = owner?.Value ?? "لا يوجد",
                        Status = "قيد التنفيذ",

                        KPI = new List<string>(),
                        Projects = new List<StrategicProject>()
                    };
                    foreach (var itemmmmmmmmmm in itemm.InitiativeKpis)
                    {
                        r.KPI.Add(itemmmmmmmmmm.Value);

                    }
                    foreach (var itemmmmmmmmmmmmm in itemm.PlanProjects)
                    {
                        var p = new StrategicProject()
                        {
                            Name = itemmmmmmmmmmmmm.Name.Value,
                            Duration = itemmmmmmmmmmmmm.Duration.Value,
                            Beneficiaries = itemmmmmmmmmmmmm.Beneficiaries.Value,
                            Auth = itemmmmmmmmmmmmm.SupervisingAuthority.Value,
                            Code = itemmmmmmmmmmmmm.Code
                        };
                        r.Projects.Add(p);

                    }
                    c.Initiatives.Add(r);

                }
                list.Add(c);



            }

            return list;



        }





        [NonAction]
        public List<CardItem> GetAnalsisPoint(int planid)
        {
           
            var data = context.AnalysisPoints.Where(i => i.PlanId == planid).ToList();
            var list = new List<CardItem>();
            var s = new CardItem();
            var w = new CardItem();
            var tt = new CardItem();
            var o = new CardItem();


            var t = String.Empty;
            var listoff = new List<string>();
            foreach (var item in data)
            {
                if (item.Type == Core.Enums.AnalysisPointsType.Strength)
                {
                    t = "نقاط القوة";
                    s.Title = t;
                    s.Elements.Add(item.Name);
                }
                else if (item.Type == Core.Enums.AnalysisPointsType.Threat)
                {
                    t = "نقاط التهديد";
                    tt.Title = t;
                    tt.Elements.Add(item.Name);
                }
                else if (item.Type == Core.Enums.AnalysisPointsType.Risk)
                {
                    t = "نقاط المخاطر";
                    w.Title = t;
                    w.Elements.Add(item.Name);
                }
                else if (item.Type == Core.Enums.AnalysisPointsType.Opportunity)
                {
                    t = "نقاط الفرص";
                    o.Title = t;
                    o.Elements.Add(item.Name);



                };
            }
            list.Add(s);
            list.Add(w);
            list.Add(tt);
            list.Add(o);

            return list;
        }
        [NonAction]
        public List<goalllll> GetGoals(int planid)
        {
            var goals = new List<goalllll>();
            var data = context.PlanGoals.Where(i => i.PlanId == planid).Include(i => i.Name).Include(i => i.Descripition).ToList();
            foreach (var item in data)
            {
                var g = new goalllll();
                g.name = item.Name.Value;
                g.hhh = item.Descripition.Value;

                goals.Add(g);
            }
            return goals;
        }

        [NonAction]
        private async Task<IActionResult> geta(int plan)
        {
            var a = await context.AnalysisPoints.Where(i=>i.PlanId==plan).ToListAsync();
            return Ok(a); // Fix for CS0029: Wrap the anonymous type in an Ok() result to return IActionResult.  
        }
        [NonAction]
        private async Task<IActionResult> getd(int plan)
        {
            var c = await context.PlanDirection.Where(i => i.PlanId == plan).FirstOrDefaultAsync();
            var a = await context.DirectionItems.Where(i => i.PlanDirectionId == c.PlanId).Include(i=>i.DirectionItemsElements).ToListAsync();
            return Ok(a); // Fix for CS0029: Wrap the anonymous type in an Ok() result to return IActionResult.  
        }
        //[NonAction]
        //private async Task<IActionResult> getgoal(int plan)
        //{
        //    var goal=await context.PlanGoals.Where(i => i.PlanId == plan).Include(i=>i.Name).Include(i=>i.Indicator).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.InitiativeItems).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.InitiativeKpis).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.PlanProjects).ToListAsync();
        //    return Ok(a); // Fix for CS0029: Wrap the anonymous type in an Ok() result to return IActionResult.  
        //}

        // ========================== API ==========================

        [NonAction]
        public List<CardItem> GetVision(int planid)
        {
            var vision = new List<CardItem>();
            var d = string.Empty;
            var PlanDirection = context.PlanDirection.Where(i => i.PlanId == planid).FirstOrDefault();
            var visions = context.DirectionItems.Where(i => i.PlanDirectionId == PlanDirection.Id && i.Type == StrategicDirectionPointType.Vision).Include(i => i.DirectionItemsElements).ToList();
            foreach (var item in visions)
            {
                var dd = new CardItem();
                dd.Title = item.Name;
                foreach (var itemm in item.DirectionItemsElements)
                {
                    dd.Elements.Add(itemm.Name);

                }

                vision.Add(dd);

            }
            return vision;
        }
        [NonAction]
        public List<CardItem> GetValue(int planid)
        {
            var vision = new List<CardItem>();
            var d = string.Empty;
            var PlanDirection = context.PlanDirection.Where(i => i.PlanId == planid).FirstOrDefault();
            var visions = context.DirectionItems.Where(i => i.PlanDirectionId == PlanDirection.Id && i.Type == StrategicDirectionPointType.Value).Include(i => i.DirectionItemsElements).ToList();
            foreach (var item in visions)
            {
                var dd = new CardItem();
                dd.Title = item.Name;
                foreach (var itemm in item.DirectionItemsElements)
                {
                    dd.Elements.Add(itemm.Name);

                }

                vision.Add(dd);

            }
            return vision;
        }
        [NonAction]
        public List<CardItem> GetMessage(int planid)
        {
            var vision = new List<CardItem>();
            var d = string.Empty;
            var PlanDirection = context.PlanDirection.Where(i => i.PlanId == planid).FirstOrDefault();
            var visions = context.DirectionItems.Where(i => i.PlanDirectionId == PlanDirection.Id && i.Type == StrategicDirectionPointType.Message).Include(i => i.DirectionItemsElements).ToList();
            foreach (var item in visions)
            {
                var dd = new CardItem();
                dd.Title = item.Name;
                foreach (var itemm in item.DirectionItemsElements)
                {
                    dd.Elements.Add(itemm.Name);

                }

                vision.Add(dd);

            }
            return vision;
        }







        // ========================== THEME COLORS ==========================
        static readonly string PrimaryColor = "#1565C0";       // Blue Darken2
        static readonly string PrimaryDark = "#0D47A1";        // Blue Darken3
        static readonly string AccentColor = "#2E7D32";        // Green Darken2
        static readonly string AccentLight = "#E8F5E9";        // Green Lighten5
        static readonly string SurfaceLight = "#E3F2FD";       // Blue Lighten5
        static readonly string SurfaceGrey = "#F5F5F5";        // Grey Lighten4
        static readonly string GoldAccent = "#F9A825";         // Yellow Darken2
        static readonly string TextDark = "#212121";           // Grey Darken4
        static readonly string TextMuted = "#616161";          // Grey Darken2
        static readonly string DividerColor = "#E0E0E0";       // Grey Lighten2

        [HttpGet("full/{id}")]
        public IActionResult GeneratePdf(int id)
        {
            var plan = context.Plans.Where(i => i.Id == id).FirstOrDefault();

            var logoPath = Path.Combine("wwwroot", "Uploads", "logo.png");
            var logo = System.IO.File.Exists(logoPath)
                ? System.IO.File.ReadAllBytes(logoPath)
                : null;

            var document = Document.Create(container =>
            {
                // ================= COVER =================
                container.Page(p =>
                {
                    PreparePage(p);
                    p.Content().Column(c =>
                    {
                        c.Item().Height(80);

                        if (logo != null)
                            c.Item().AlignCenter().Height(110).Image(logo, ImageScaling.FitHeight);

                        c.Item().Height(30);

                        // decorative line
                        c.Item().AlignCenter().Width(200).Height(3)
                            .Background(PrimaryColor).CornerRadius(2);

                        c.Item().Height(20);

                        c.Item().Text($"الخطة الاستراتيجية")
                            .FontSize(34).Bold()
                            .FontColor(PrimaryColor)
                            .AlignCenter();

                        c.Item().Height(8);

                        c.Item().Text(plan.Name)
                            .FontSize(26).SemiBold()
                            .FontColor(AccentColor)
                            .AlignCenter();

                        c.Item().Height(8);

                        c.Item().Text($"لسنة {plan.CreatedAt?.Year ?? DateTime.UtcNow.Year}")
                            .FontSize(18)
                            .FontColor(TextMuted)
                            .AlignCenter();

                        c.Item().Height(30);

                        // bottom decorative line
                        c.Item().AlignCenter().Width(120).Height(2)
                            .Background(GoldAccent).CornerRadius(2);
                    });
                });

                // ================= ANALYSIS =================
                container.Page(p =>
                {
                    PreparePage(p);
                    StageCover(p, "مرحلة التحليل الاستراتيجي", "01");
                });

                container.Page(p =>
                {
                    PreparePage(p);
                    BuildCardsPage(p, "تحليل SWOT", GetAnalsisPoint(id), SurfaceLight);
                });

                // ================= ORIENTATION =================
                container.Page(p =>
                {
                    PreparePage(p);
                    StageCover(p, "مرحلة التوجه الاستراتيجي", "02");
                });

                container.Page(p =>
                {
                    PreparePage(p);
                    BuildOrientationPage(p, id);
                });

                container.Page(p =>
                {
                    PreparePage(p);
                    StageCover(p, "مرحلة الأهداف", "03");
                });

                container.Page(p =>
                {
                    PreparePage(p);
                    p.Content().Column(col =>
                    {
                        col.Item().Text("الأهداف الاستراتيجية")
                            .FontSize(22).SemiBold()
                            .FontColor(PrimaryColor)
                            .AlignCenter();

                        col.Item().Height(6);
                        col.Item().AlignCenter().Width(80).Height(2)
                            .Background(GoldAccent).CornerRadius(2);
                        col.Item().Height(16);

                        var goalIndex = 1;
                        foreach (var goal in GetGoals(id))
                        {
                            BuildInfoBox(col, $"الهدف {goalIndex}: {goal.name}", goal.hhh, SurfaceLight);
                            col.Item().Height(12);
                            goalIndex++;
                        }
                    });
                });

                // ================= INITIATIVES =================
                container.Page(p =>
                {
                    PreparePage(p);
                    StageCover(p, "المبادرات ومؤشرات الأداء", "04");
                });

                foreach (var goal in GetTotalGoal(id))
                {
                    container.Page(p =>
                    {
                        PreparePage(p);
                        BuildGoalPage(p, goal);
                    });
                }

                // ================= SUMMARY TABLE =================
                container.Page(p =>
                {
                    PreparePage(p);
                    StageCover(p, "جدول ملخص الخطة", "05");
                });

                container.Page(p =>
                {
                    PreparePageLandscape(p);
                    BuildTable(p, Get(id));
                });
            });

            return File(document.GeneratePdf(), "application/pdf", "StrategicPlan.pdf");
        }

        // ========================== PAGE SETUP ==========================







        void PreparePage(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.Margin(2, Unit.Centimetre);
            page.DefaultTextStyle(x => x.FontFamily("Cairo").FontSize(13).FontColor(TextDark)
                .DirectionFromRightToLeft());
            page.ContentFromRightToLeft();

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
        }

        void PreparePageLandscape(PageDescriptor page)
        {
            page.Size(PageSizes.A4.Landscape());
            page.Margin(1.5f, Unit.Centimetre);
            page.DefaultTextStyle(x => x.FontFamily("Cairo").FontSize(13).FontColor(TextDark)
                .DirectionFromRightToLeft());
            page.ContentFromRightToLeft();

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
        }

        void StageCover(PageDescriptor page, string title, string stageNumber)
        {
            page.Content().AlignCenter().Column(c =>
            {
                c.Item().Height(160);

                // stage number badge
                c.Item().AlignCenter().Width(60).Height(60)
                    .Background(PrimaryColor).CornerRadius(30)
                    .AlignCenter().AlignMiddle()
                    .Text(stageNumber)
                        .FontSize(24).Bold().FontColor(Colors.White)
                        .AlignCenter();

                c.Item().Height(20);

                c.Item().Text(title)
                    .FontSize(28).Bold()
                    .FontColor(PrimaryDark)
                    .AlignCenter();

                c.Item().Height(12);

                // decorative underline
                c.Item().AlignCenter().Width(100).Height(3)
                    .Background(GoldAccent).CornerRadius(2);
            });
        }

        // ========================== ANALYSIS / ORIENTATION ==========================
        // SWOT quadrant colors
        static readonly string StrengthColor = "#2E7D32";   // Green
        static readonly string StrengthBg = "#E8F5E9";
        static readonly string WeaknessColor = "#C62828";   // Red
        static readonly string WeaknessBg = "#FFEBEE";
        static readonly string OpportunityColor = "#1565C0"; // Blue
        static readonly string OpportunityBg = "#E3F2FD";
        static readonly string ThreatColor = "#E65100";      // Orange
        static readonly string ThreatBg = "#FFF3E0";

        void BuildCardsPage(PageDescriptor page, string title, List<CardItem> items, string bg)
        {
            // items order: [0]=Strength, [1]=Risk/Weakness, [2]=Threat, [3]=Opportunity
            var swotColors = new[] { StrengthColor, WeaknessColor, ThreatColor, OpportunityColor };
            var swotBgs = new[] { StrengthBg, WeaknessBg, ThreatBg, OpportunityBg };

            page.Content().Column(col =>
            {
                col.Item().Text(title)
                    .FontSize(22).SemiBold()
                    .FontColor(PrimaryColor)
                    .DirectionFromRightToLeft()
                    .AlignCenter();

                col.Item().Height(6);
                col.Item().AlignCenter().Width(80).Height(2)
                    .Background(GoldAccent).CornerRadius(2);
                col.Item().Height(16);

                // 2x2 SWOT grid
                // Row 1: Strength + Weakness
                col.Item().ContentFromRightToLeft().Row(row =>
                {
                    if (items.Count > 0)
                        row.RelativeItem().Element(c =>
                            BuildSwotCell(c, items[0], swotColors[0], swotBgs[0]));
                    row.AutoItem().Width(10);
                    if (items.Count > 1)
                        row.RelativeItem().Element(c =>
                            BuildSwotCell(c, items[1], swotColors[1], swotBgs[1]));
                });

                col.Item().Height(10);

                // Row 2: Threat + Opportunity
                col.Item().ContentFromRightToLeft().Row(row =>
                {
                    if (items.Count > 2)
                        row.RelativeItem().Element(c =>
                            BuildSwotCell(c, items[2], swotColors[2], swotBgs[2]));
                    row.AutoItem().Width(10);
                    if (items.Count > 3)
                        row.RelativeItem().Element(c =>
                            BuildSwotCell(c, items[3], swotColors[3], swotBgs[3]));
                });
            });
        }

        void BuildSwotCell(IContainer container, CardItem item, string accentColor, string bgColor)
        {
            container
                .Background(bgColor)
                .Padding(12)
                .CornerRadius(8)
                .ContentFromRightToLeft()
                .Column(c =>
                {
                    // title with colored accent
                    c.Item().AlignCenter().Text(item.Title ?? "-")
                        .Bold().FontSize(15)
                        .FontColor(accentColor)
                        .DirectionFromRightToLeft();

                    c.Item().Height(6);
                    c.Item().AlignCenter().Width(40).Height(2)
                        .Background(accentColor).CornerRadius(1);
                    c.Item().Height(8);

                    foreach (var e in item.Elements)
                    {
                        c.Item().AlignRight()
                            .Text($"\u25CF  {e}")
                            .DirectionFromRightToLeft()
                            .FontSize(12).FontColor(TextDark);
                        c.Item().Height(3);
                    }
                });
        }

        void BuildOrientationPage(PageDescriptor page, int planid)
        {
            var sectionColors = new[] { PrimaryColor, AccentColor, GoldAccent };
            page.Content().Column(col =>
            {
                BuildOrientationSection(col, "الرؤية", SurfaceLight, GetVision(planid), sectionColors[0]);
                col.Item().Height(8);
                BuildOrientationSection(col, "الرسالة", AccentLight, GetMessage(planid), sectionColors[1]);
                col.Item().Height(8);
                BuildOrientationSection(col, "القيم", SurfaceGrey, GetValue(planid), sectionColors[2]);
            });
        }

        void BuildOrientationSection(ColumnDescriptor col, string title, string bg, List<CardItem> items, string accentColor)
        {
            col.Item().ContentFromRightToLeft().Row(row =>
            {
                row.AutoItem().Width(4).Height(28).Background(accentColor).CornerRadius(2);
                row.AutoItem().Width(8);
                row.RelativeItem().AlignRight().AlignMiddle()
                    .Text(title).FontSize(20).SemiBold().FontColor(accentColor)
                    .DirectionFromRightToLeft();
            });

            col.Item().Height(10);

            foreach (var item in items)
            {
                BuildCard(col, item.Title, bg, item.Elements, accentColor, "العنصر الرئيسي");
                col.Item().Height(10);
            }
        }

        void BuildCard(ColumnDescriptor col, string title, string bg, List<string> elements, string accentColor, string titleLabel = null)
        {
            col.Item().ContentFromRightToLeft().Row(row =>
            {
                // colored right border accent (RTL)
                row.AutoItem().Width(4).Background(accentColor).CornerRadius(2);

                row.RelativeItem()
                    .Background(bg)
                    .Padding(14)
                    .ContentFromRightToLeft()
                    .Column(c =>
                    {
                        if (!string.IsNullOrEmpty(title))
                        {
                            if (!string.IsNullOrEmpty(titleLabel))
                            {
                                c.Item().AlignRight().Text(t =>
                                {
                                    t.Span($"{titleLabel}: ").FontSize(13).SemiBold()
                                        .FontColor(TextMuted).DirectionFromRightToLeft();
                                    t.Span(title).FontSize(16).SemiBold()
                                        .FontColor(accentColor).DirectionFromRightToLeft();
                                });
                            }
                            else
                            {
                                c.Item().AlignRight().Text(title)
                                    .SemiBold()
                                    .DirectionFromRightToLeft()
                                    .FontSize(16)
                                    .FontColor(accentColor);
                            }
                            c.Item().Height(6);
                        }

                        if (elements.Count > 0)
                        {
                            c.Item().AlignRight().Text("اسم العنصر:")
                                .FontSize(12).SemiBold()
                                .DirectionFromRightToLeft()
                                .FontColor(TextMuted);
                            c.Item().Height(4);
                        }

                        foreach (var e in elements)
                        {
                            c.Item().AlignRight()
                                .Text($"\u25CF  {e}")
                                .DirectionFromRightToLeft()
                                .FontSize(13).FontColor(TextDark);
                            c.Item().Height(3);
                        }
                    });
            });
        }

        // ========================== GOALS ==========================
        void BuildGoalPage(PageDescriptor page, StrategicGoal goal)
        {
            page.Content().Column(col =>
            {
                // Goal header with accent
                col.Item().Background(SurfaceLight).Padding(16).CornerRadius(8)
                    .ContentFromRightToLeft()
                    .Column(goalCol =>
                    {
                        goalCol.Item().ContentFromRightToLeft().Row(row =>
                        {
                            row.AutoItem().Width(5).Height(24).Background(PrimaryColor).CornerRadius(2);
                            row.AutoItem().Width(8);
                            row.RelativeItem().AlignRight().AlignMiddle()
                                .Text(goal.Name).FontSize(18).Bold().FontColor(PrimaryColor)
                                .DirectionFromRightToLeft();
                        });

                        goalCol.Item().Height(12);

                        // اسم الهدف
                        BuildLabelValue(goalCol, "اسم الهدف", goal.Name);
                        goalCol.Item().Height(6);

                        // الوصف
                        BuildLabelValue(goalCol, "الوصف", goal.Description);
                        goalCol.Item().Height(6);

                        // المؤشر الرئيسي
                        BuildLabelValue(goalCol, "المؤشر الرئيسي", goal.main, AccentColor);
                    });

                col.Item().Height(16);

                foreach (var i in goal.Initiatives)
                {
                    BuildInitiative(col, i);
                    col.Item().Height(12);
                }
            });
        }

        void BuildInitiative(ColumnDescriptor col, StrategicInitiative i)
        {
            col.Item().ContentFromRightToLeft().Row(outerRow =>
            {
                // green right border (RTL)
                outerRow.AutoItem().Width(4).Background(AccentColor).CornerRadius(2);

                outerRow.RelativeItem()
                    .Background(AccentLight)
                    .Padding(14)
                    .ContentFromRightToLeft()
                    .Column(c =>
                    {
                        // initiative name with label
                        c.Item().AlignRight().Text(t =>
                        {
                            t.Span("اسم المبادرة: ").FontSize(13).SemiBold()
                                .FontColor(TextMuted).DirectionFromRightToLeft();
                            t.Span(i.Name).FontSize(15).SemiBold()
                                .FontColor(AccentColor).DirectionFromRightToLeft();
                        });

                        c.Item().Height(8);

                        // info row with labels
                        c.Item().Background(Colors.White).Padding(10).CornerRadius(6)
                            .Row(infoRow =>
                            {
                                infoRow.RelativeItem().AlignRight().Text(t =>
                                {
                                    t.Span("الحالة: ").SemiBold().FontSize(11).FontColor(TextMuted);
                                    t.Span(i.Status).FontSize(11).FontColor(AccentColor);
                                    t.Span("  |  ").FontSize(11).FontColor(DividerColor);
                                    t.Span("المسؤول: ").SemiBold().FontSize(11).FontColor(TextMuted);
                                    t.Span(i.Owner).FontSize(11).FontColor(TextDark);
                                });
                            });

                        c.Item().Height(8);

                        // KPIs
                        if (i.KPI != null && i.KPI.Count > 0)
                        {
                            c.Item().Text("مؤشرات الأداء:")
                                .SemiBold().FontSize(12).AlignRight()
                                .FontColor(TextMuted);
                            c.Item().Height(4);

                            foreach (var kpi in i.KPI)
                            {
                                c.Item().PaddingRight(10).AlignRight()
                                    .Text($"\u25C6  {kpi}")
                                    .FontSize(12).FontColor(TextDark);
                                c.Item().Height(2);
                            }
                        }

                        c.Item().Height(10);

                        BuildProjectsTable(c, i.Projects);
                    });
            });
        }
        void BuildTable(PageDescriptor page, List<TableRow> data)
        {
            page.Content().ContentFromRightToLeft().Column(col =>
            {
                col.Item().Text("جدول الأهداف والمبادرات والمشاريع")
                    .Bold().FontSize(20)
                    .FontColor(PrimaryColor)
                    .DirectionFromRightToLeft()
                    .AlignCenter();

                col.Item().Height(6);
                col.Item().AlignCenter().Width(80).Height(2)
                    .Background(GoldAccent).CornerRadius(2);
                col.Item().Height(14);

                col.Item().Table(table =>
                {
                    // RTL order: right column = الهدف, left column = نسبة الإنجاز
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(6);   // الهدف
                        columns.RelativeColumn(6);   // المبادرة
                        columns.RelativeColumn(6);   // المشروع
                        columns.RelativeColumn(4);   // الأولوية
                        columns.RelativeColumn(5);   // بداية
                        columns.RelativeColumn(5);   // نهاية
                        columns.RelativeColumn(5);   // نسبة الإنجاز
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(c => HeaderCell(c, "الهدف"));
                        header.Cell().Element(c => HeaderCell(c, "المبادرة"));
                        header.Cell().Element(c => HeaderCell(c, "المشروع"));
                        header.Cell().Element(c => HeaderCell(c, "الأولوية"));
                        header.Cell().Element(c => HeaderCell(c, "بداية"));
                        header.Cell().Element(c => HeaderCell(c, "نهاية"));
                        header.Cell().Element(c => HeaderCell(c, "نسبة الإنجاز"));
                    });

                    // Width of one relative unit: landscape A4 less the 1.5cm margins,
                    // shared by the 37 units defined above.
                    const float unit = (842f - 2 * 42.5f) / 37f;

                    var rowIndex = 0;
                    foreach (var row in data)
                    {
                        var isAlt = rowIndex % 2 == 1;
                        table.Cell().Element(c => StyledBodyCell(c, row.goal, isAlt, 6 * unit));
                        table.Cell().Element(c => StyledBodyCell(c, row.initiative, isAlt, 6 * unit));
                        table.Cell().Element(c => StyledBodyCell(c, row.project, isAlt, 6 * unit));
                        table.Cell().Element(c => StyledBodyCell(c, row.priority, isAlt, 4 * unit));
                        table.Cell().Element(c => StyledBodyCell(c, row.startdate, isAlt, 5 * unit));
                        table.Cell().Element(c => StyledBodyCell(c, row.enddate, isAlt, 5 * unit));
                        table.Cell().Element(c => PercentageBarCell(c, row.percentage));
                        rowIndex++;
                    }
                });
            });
        }

        void HeaderCell(IContainer container, string text)
        {
            container
                .Background(PrimaryColor)
                .PaddingVertical(10)
                .PaddingHorizontal(8)
                .AlignCenter()
                .AlignMiddle()
                .MinHeight(40)
                .Text(text)
                    .SemiBold()
                    .FontSize(12)
                    .FontColor(Colors.White)
                    .DirectionFromRightToLeft();
        }

        void BodyCell(IContainer container, string text)
        {
            container
                .BorderBottom(1)
                .BorderColor(DividerColor)
                .PaddingVertical(10)
                .PaddingHorizontal(8)
                .MinHeight(40)
                .AlignRight()
                .AlignMiddle()
                .Text(text ?? "-")
                    .FontSize(11).FontColor(TextDark)
                    .DirectionFromRightToLeft();
        }

        void StyledBodyCell(IContainer container, string text, bool alternate, float columnWidth)
        {
            var value = SpaceAfterSeparators(text);
            container
                .Background(alternate ? SurfaceGrey : Colors.White)
                .BorderBottom(1)
                .BorderColor(DividerColor)
                .PaddingVertical(10)
                .PaddingHorizontal(8)
                .MinHeight(40)
                .AlignCenter()
                .AlignMiddle()
                .Text(value)
                    .FontSize(FitFontSize(value, columnWidth - 16, 11)).FontColor(TextDark)
                    .DirectionFromRightToLeft();
        }

        // ========================== TEXT FITTING ==========================
        //
        // «حجم النص يكون دايما تلقائي»: table cells used a fixed font size, so a
        // long word in a narrow column was cut in the middle ("المستفيدو / ن",
        // "الطائ / ف") and the data was hard to read. Each cell now picks the
        // largest size, up to its normal one, at which its longest word still
        // fits the column; longer values wrap between words as usual.

        // Cairo's glyphs average a little over half the font size in width.
        const float GlyphWidthPerPoint = 0.58f;

        static float FitFontSize(string text, float availableWidth, float baseSize, float minSize = 7f)
        {
            if (string.IsNullOrWhiteSpace(text) || availableWidth <= 0) return baseSize;

            var longestWord = text
                .Split(new[] { ' ', '\n', '\t' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(w => w.Length)
                .DefaultIfEmpty(1)
                .Max();

            var fitting = availableWidth / (longestWord * GlyphWidthPerPoint);
            return Math.Clamp(fitting, minSize, baseSize);
        }

        // Lists typed as "الخرج،الرياض،القصيم" have nowhere to wrap, so the
        // whole list was treated as one long word. A space after each comma lets
        // it wrap between names.
        static string SpaceAfterSeparators(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return "-";

            var spaced = text.Replace("،", "، ").Replace(",", ", ").Replace("؛", "؛ ");
            return string.Join(" ", spaced.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }

        void PercentageBarCell(IContainer container, string percentageText)
        {
            var value = 0f;
            if (float.TryParse(percentageText, out var parsed))
                value = Math.Clamp(parsed, 0, 100);

            string barColor = value switch
            {
                >= 75 => Colors.Green.Medium,
                >= 50 => Colors.Orange.Medium,
                >= 25 => GoldAccent,
                _ => Colors.Red.Medium
            };

            container
                .BorderBottom(1)
                .BorderColor(DividerColor)
                .Padding(5)
                .AlignMiddle()
                .Column(col =>
                {
                    col.Item().AlignCenter().Text($"%{value:0}")
                        .FontSize(9).Bold().FontColor(barColor);

                    col.Item().Height(3);

                    col.Item().Height(8).Background(Colors.Grey.Lighten3).CornerRadius(4)
                        .Row(row =>
                        {
                            if (value > 0)
                                row.RelativeItem((int)Math.Max(value, 1))
                                    .Height(8)
                                    .Background(barColor)
                                    .CornerRadius(4);

                            if (value < 100)
                                row.RelativeItem((int)Math.Max(100 - value, 1))
                                    .Height(8);
                        });
                });
        }



        static IContainer ProjectHeaderCell(IContainer c) =>
            c.Background(PrimaryDark)
             .Padding(7)
             .AlignCenter()
             .DefaultTextStyle(x => x.SemiBold().FontSize(10).FontColor(Colors.White));

        static IContainer ProjectBodyCell(IContainer c, bool alternate) =>
            c.Background(alternate ? SurfaceGrey : Colors.White)
             .BorderBottom(1)
             .BorderColor(DividerColor)
             .Padding(6)
             .AlignCenter()
             .DefaultTextStyle(x => x.FontSize(10).FontColor(TextDark));



        void BuildProjectsTable(ColumnDescriptor col, List<StrategicProject> projects)
        {
            // An initiative without projects used to print the table header with
            // no rows under it, which read as missing data.
            if (projects == null || projects.Count == 0)
            {
                col.Item().AlignRight().Text("لا توجد مشاريع مرتبطة بهذه المبادرة")
                    .FontSize(11).Italic().FontColor(TextMuted)
                    .DirectionFromRightToLeft();
                return;
            }

            // Column weights, right to left. The header «المستفيدون» and lists of
            // places no longer fit the old 2-unit columns.
            float[] weights = { 3, 4, 2, 4, 3 };
            // Width of one unit: portrait A4 less the 2cm margins, the card's
            // 4pt accent and its 14pt padding on both sides.
            var unit = (595f - 2 * 56.7f - 4 - 2 * 14) / weights.Sum();
            const float cellPadding = 2 * 6;

            col.Item().ContentFromRightToLeft().Table(t =>
            {
                // RTL order: right = الجهة المشرفة, left = رمز المشروع
                t.ColumnsDefinition(c =>
                {
                    foreach (var w in weights) c.RelativeColumn(w);
                });

                string[] headers = { "الجهة المشرفة", "المستفيدون", "المدة", "اسم المشروع", "رمز المشروع" };
                t.Header(h =>
                {
                    for (var i = 0; i < headers.Length; i++)
                    {
                        var width = weights[i] * unit - cellPadding;
                        ProjectHeaderCell(h.Cell()).Text(headers[i])
                            .FontSize(FitFontSize(headers[i], width, 10));
                    }
                });

                var pIndex = 0;
                foreach (var p in projects)
                {
                    var isAlt = pIndex % 2 == 1;
                    string[] values = { p.Auth, p.Beneficiaries, p.Duration, p.Name, p.Code };
                    for (var i = 0; i < values.Length; i++)
                    {
                        var value = SpaceAfterSeparators(values[i]);
                        var width = weights[i] * unit - cellPadding;
                        ProjectBodyCell(t.Cell(), isAlt).Text(value)
                            .FontSize(FitFontSize(value, width, 10))
                            .DirectionFromRightToLeft();
                    }
                    pIndex++;
                }
            });
        }

        void BuildLabelValue(ColumnDescriptor col, string label, string value, string valueColor = null)
        {
            col.Item().PaddingRight(13).AlignRight().Text(t =>
            {
                t.Span($"{label}: ").FontSize(13).SemiBold()
                    .FontColor(TextMuted).DirectionFromRightToLeft();
                t.Span(value ?? "-").FontSize(13)
                    .FontColor(valueColor ?? TextDark).DirectionFromRightToLeft();
            });
        }

        void BuildInfoBox(ColumnDescriptor col, string title, string content, string backgroundColor = null)
        {
            col.Item().ContentFromRightToLeft().Row(row =>
            {
                // right border accent (RTL)
                row.AutoItem().Width(4).Background(PrimaryColor).CornerRadius(2);

                row.RelativeItem()
                    .Background(backgroundColor ?? SurfaceGrey)
                    .Padding(18)
                    .ContentFromRightToLeft()
                    .Column(c =>
                    {
                        c.Item().AlignRight().Text(title)
                            .FontSize(14).SemiBold()
                            .FontColor(PrimaryColor)
                            .DirectionFromRightToLeft();

                        c.Item().Height(6);

                        c.Item().Height(1).Background(DividerColor);

                        c.Item().Height(8);

                        // الوصف label
                        c.Item().AlignRight().Text(t =>
                        {
                            t.Span("الوصف: ").FontSize(12).SemiBold()
                                .FontColor(TextMuted).DirectionFromRightToLeft();
                            t.Span(content).FontSize(13)
                                .FontColor(TextDark).DirectionFromRightToLeft();
                        });
                    });
            });
        }


        static IContainer HeaderCell(IContainer c) =>
            c.Background(PrimaryColor)
             .Padding(7)
             .AlignCenter()
             .DefaultTextStyle(x => x.SemiBold().FontSize(10).FontColor(Colors.White));

        static IContainer BodyCell(IContainer c) =>
            c.BorderBottom(1)
             .BorderColor(DividerColor)
             .Padding(6)
             .AlignCenter()
             .DefaultTextStyle(x => x.FontSize(10).FontColor(TextDark));

        // ========================== FAKE DATA ==========================
        List<CardItem> FakeAnalysis() => new()
        {
            new CardItem
            {
                Title = "نقاط القوة",
                Elements = { "كوادر مؤهلة", "بنية تقنية قوية" }
            },
            new CardItem
            {
                Title = "نقاط الضعف",
                Elements = { "بطء الإجراءات" }
            }
        };

        List<CardItem> FakeVisions() => new()
        {
            new CardItem
            {
                Title = "رؤية التحول الرقمي",
                Elements = { "رقمنة الخدمات", "تحسين تجربة المستخدم" }
            },
            new CardItem
            {
                Title = "رؤية الاستدامة",
                Elements = { "كفاءة الموارد", "الاستدامة المالية" }
            }
        };

        List<CardItem> FakeMissions() => new()
        {
            new CardItem
            {
                Title = "رسالتنا",
                Elements = { "خدمة عالية الجودة", "رضا المستفيدين" }
            }
        };

        List<CardItem> FakeValues() => new()
        {
            new CardItem
            {
                Title = "قيم العمل",
                Elements = { "الشفافية", "الابتكار", "العمل الجماعي" }
            }
        };

        List<StrategicGoal> FakeGoals() => new()
        {
            new StrategicGoal
            {
               
                Name = "رفع كفاءة الأداء",
                Description = "تحسين الأداء المؤسسي",
               
                Initiatives =
                {
                    new StrategicInitiative
                    {
                       
                        Name = "تطوير العمليات",
                        Owner = "الجودة",
                        Status = "قيد التنفيذ",
                       
                        Projects =
                        {
                            new StrategicProject{ Code="P1", Name="أتمتة النماذج" }
                        }
                    }
                }
            }
        };
    }


    // ========================== MODELS ==========================
    public class CardItem
    {
        public string Title { get; set; }
        public List<string> Elements { get; set; } = new();
    }
    
    public class TableRow
    {
        public string startdate { get; set; }
        public string enddate { get; set; }
        public string priority { get; set; }
        public string project { get; set; }
        public string initiative { get; set; }
        public string goal { get; set; }
        public string percentage { get; set; }
    }


    public class StrategicGoal
    {
       
        public string Name { get; set; }
        public string Description { get; set; }
        
       
        public string main { get; set; }
        public List<StrategicInitiative> Initiatives { get; set; } = new();
    }

    public class StrategicInitiative
    {
     
        public string Name { get; set; }
        public string Owner { get; set; }
        public string Status { get; set; }
        public List<string> KPI { get; set; }
        public List<StrategicProject> Projects { get; set; } = new();
    }

    public class StrategicProject
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public string Auth { get; set; }
        public string Duration { get; set; }
        public string Beneficiaries { get; set; }

    }
}
