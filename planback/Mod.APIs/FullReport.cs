using Mod.APIs.Controllers;

namespace Mod.APIs
{
    public class FullReport
    {
        private readonly ModContext context;
        private readonly ICurrentUserService currentUser;

        public FullReport(ModContext context, ICurrentUserService currentUser)
        {
            this.context = context;
            this.currentUser = currentUser;
        }
        public List<CardItem> GetAnalsisPoint(int planid)
        {
            var user = currentUser.GetCurrentUserAsync().Result;
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
                    t = "المخاطر";
                    w.Title = t;
                    w.Elements.Add(item.Name);
                }
                else if (item.Type == Core.Enums.AnalysisPointsType.Opportunity)
                {
                    t = "الفرص";
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
        public List<goalllll> GetGoals(int planid)
        {
            var goals = new List<goalllll>();
            var data = context.PlanGoals.Where(i => i.PlanId == planid).Include(i => i.Name).Include(i => i.Descripition).ToList();
            foreach (var item in data)
            {
                var g = new goalllll();
                g.name = item.Name.ToString();
                g.hhh = item.Descripition.ToString();

                goals.Add(g);
            }
            return goals;
        }
        public List<StrategicGoal> GetTotalGoal(int planid)
        {
            var goals = context.PlanGoals.Where(i => i.PlanId == planid).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeKpis).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeItems).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Name).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.PlanProjects).ThenInclude(i=>i.Duration).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.PlanProjects).ThenInclude(i=>i.Beneficiaries).Include(i=>i.PlanInitiatives).ThenInclude(i=>i.PlanProjects).ThenInclude(i=>i.SupervisingAuthority).ToList();
            var list = new List<StrategicGoal>();
            foreach (var item in goals)
            {
                var c = new StrategicGoal()
                {
                    Name = item.Name.Value,
                    Description = item.Descripition.Value,
                    main=item.Indicator.Value,
                    Initiatives = new List<StrategicInitiative>()








                };
                foreach (var itemm in item.PlanInitiatives)
                {
                    var owner = itemm.InitiativeItems.Where(i => i.Type == Core.Entities.Initiative.InitiativeItemType.AdminInCharge).FirstOrDefault();
                    
                    var r=new StrategicInitiative()
                    {
                        Name = itemm.Name.Value,
                        Owner = owner.Value,
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
        public List<TableRow> Get(int planid)
        {
            var goals = context.PlanGoals.Where(i => i.PlanId == planid).Include(i => i.Indicator).Include(i => i.Descripition).Include(i => i.Name).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeKpis).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeItems).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Name).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Duration).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.Beneficiaries).Include(i => i.PlanInitiatives).ThenInclude(i => i.PlanProjects).ThenInclude(i => i.SupervisingAuthority).Include(i => i.PlanInitiatives).ThenInclude(i => i.Name).Include(i => i.PlanInitiatives).ThenInclude(i => i.InitiativeItems).ToList();
            var list = new List<TableRow>();
            foreach (var item in goals)
            {
                var x = new TableRow()
                {
                    goal = item.Name.Value,

                };
                foreach (var initiative in item.PlanInitiatives)
                {
                    x.initiative=initiative.Name.Value;
                    foreach (var project in initiative.PlanProjects)
                    {
                        x.project = project.Name.Value;
                        x.priority = project.Priority.Value;
                        x.startdate = project.StartDate.ToString();
                        x.enddate = project.EndDate.ToString();
                        x.percentage = project.Percentage?.Value ?? "0";
                        list.Add(x);

                    }

                }
            }
            return list;
        }
        public class goalllll
        {
            public string name
            { get; set; } = string.Empty;
            public string hhh { get; set; } = string.Empty;



        }
    }
}
