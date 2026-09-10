namespace Mod.Repository.Data
{
    public class ModContext : IdentityDbContext<AppUser, UserRole, int,
    IdentityUserClaim<int>, IdentityUserRole<int>, IdentityUserLogin<int>, UserRoleClaim, IdentityUserToken<int>>
    {
        #region Constructors
        public ModContext(DbContextOptions<ModContext> options) : base(options)
        {
        }
        #endregion

        #region DBSets
        public DbSet<Units> Units { get; set; }
        public DbSet<AppUser> AppUsers { get; set; }
        public DbSet<UserRole> UsersRole { get; set; }
        public DbSet<UserRoleClaim> UserPermissions { get; set; }
        public DbSet<AnalysisPoints> AnalysisPoints { get; set; }
        public DbSet<PlanAnalysis> PlanAnalysis { get; set; }
        public DbSet<PlanMaster> PlanMaster { get; set; }
        public DbSet<Plans> Plans { get; set; }
        public DbSet<Regions> Regions { get; set; }
        public DbSet<PlanDirection> PlanDirection { get; set; }
        public DbSet<DirectionItems> DirectionItems { get; set; }
        public DbSet<DirectionItemsElements> DirectionItemsElements { get; set; }
        public DbSet<PlanGoalsStep> PlanGoalsStep { get; set; }
        public DbSet<PlanGoals> PlanGoals { get; set; }
        public DbSet<GoalItems> GoalItems { get; set; }
        public DbSet<PlanInitiative> PlanInitiatives { get; set; }
        public DbSet<PlanInitiativeStep> PlanInitiativeStep { get; set; }
        public DbSet<InitiativeItem> InitiativeItems { get; set; }
        public DbSet<InitiativeKpi> InitiativeKpis { get; set; }
        public DbSet<PlanProjects> PlanProjects { get; set; }
        public DbSet<PlanProjectsStep> PlanProjectsStep { get; set; }
        public DbSet<ProjectItems> ProjectItems { get; set; }
        public DbSet<ProjectPercentageHistory> ProjectPercentageHistory { get; set; }
        public DbSet<Blogs> Blogs { get; set; }
        public DbSet<OurGoals> OurGoals { get; set; }
        public DbSet<OurVision> OurVision { get; set; }
        public DbSet<OurMessages> OurMessages { get; set; }
        public DbSet<Awareness> Awareness { get; set; }
        public DbSet<Notification> Notification { get; set; }
        public DbSet<PageTitle> PageTitles { get; set; }
        #endregion

        #region Methods
        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            base.OnModelCreating(builder);
            builder.Entity<UserRole>()
                .HasMany(r => r.UserRoleClaims)
                .WithOne()
                .HasForeignKey(rc => rc.RoleId)
                .IsRequired();

            builder.Entity<PageTitle>()
                .HasIndex(p => p.Key)
                .IsUnique();

            var seedDate = new DateTime(2026, 3, 7, 0, 0, 0, DateTimeKind.Utc);
            builder.Entity<PageTitle>().HasData(
                // الصفحة الرئيسية
                new PageTitle { Id = 1, Key = "home_leadership_news", PageName = "الصفحة الرئيسية", DefaultValue = "اخبار القيادة", CurrentValue = "اخبار القيادة", CreatedAt = seedDate },
                new PageTitle { Id = 2, Key = "home_main_units", PageName = "الصفحة الرئيسية", DefaultValue = "الوحدات الرئيسية", CurrentValue = "الوحدات الرئيسية", CreatedAt = seedDate },
                new PageTitle { Id = 3, Key = "home_strategic_plan", PageName = "الصفحة الرئيسية", DefaultValue = "الخطة الاستراتيجية", CurrentValue = "الخطة الاستراتيجية", CreatedAt = seedDate },
                // Blogs
                new PageTitle { Id = 4, Key = "blogs_page_title", PageName = "المدونات", DefaultValue = "المدونات", CurrentValue = "المدونات", CreatedAt = seedDate },
                new PageTitle { Id = 5, Key = "blogs_section_title", PageName = "المدونات", DefaultValue = "قسم المدونات", CurrentValue = "قسم المدونات", CreatedAt = seedDate },
                new PageTitle { Id = 6, Key = "blogs_top_news", PageName = "المدونات", DefaultValue = "أبرز الأخبار", CurrentValue = "أبرز الأخبار", CreatedAt = seedDate },
                new PageTitle { Id = 7, Key = "blogs_manage_title", PageName = "المدونات", DefaultValue = "إدارة المدونات", CurrentValue = "إدارة المدونات", CreatedAt = seedDate },
                new PageTitle { Id = 8, Key = "blogs_list_title", PageName = "المدونات", DefaultValue = "قائمة المدونات", CurrentValue = "قائمة المدونات", CreatedAt = seedDate },
                // Awareness
                new PageTitle { Id = 9, Key = "awareness_page_title", PageName = "التوعية", DefaultValue = "التوعية", CurrentValue = "التوعية", CreatedAt = seedDate },
                new PageTitle { Id = 10, Key = "awareness_top_topics", PageName = "التوعية", DefaultValue = "أبرز المواضيع", CurrentValue = "أبرز المواضيع", CreatedAt = seedDate },
                new PageTitle { Id = 11, Key = "awareness_manage_title", PageName = "التوعية", DefaultValue = "إدارة التوعية", CurrentValue = "إدارة التوعية", CreatedAt = seedDate },
                new PageTitle { Id = 12, Key = "awareness_list_title", PageName = "التوعية", DefaultValue = "قائمة التوعية", CurrentValue = "قائمة التوعية", CreatedAt = seedDate },
                // Goals
                new PageTitle { Id = 13, Key = "goals_page_title", PageName = "الأهداف", DefaultValue = "أهدافنا", CurrentValue = "أهدافنا", CreatedAt = seedDate },
                new PageTitle { Id = 14, Key = "goals_section_title", PageName = "الأهداف", DefaultValue = "قسم الأهداف", CurrentValue = "قسم الأهداف", CreatedAt = seedDate },
                new PageTitle { Id = 15, Key = "goals_top_goals", PageName = "الأهداف", DefaultValue = "أبرز الأهداف", CurrentValue = "أبرز الأهداف", CreatedAt = seedDate },
                new PageTitle { Id = 16, Key = "goals_manage_title", PageName = "الأهداف", DefaultValue = "إدارة الأهداف", CurrentValue = "إدارة الأهداف", CreatedAt = seedDate },
                new PageTitle { Id = 17, Key = "goals_list_title", PageName = "الأهداف", DefaultValue = "قائمة الأهداف", CurrentValue = "قائمة الأهداف", CreatedAt = seedDate },
                // Vision
                new PageTitle { Id = 18, Key = "vision_page_title", PageName = "الرؤية", DefaultValue = "رؤيتنا", CurrentValue = "رؤيتنا", CreatedAt = seedDate },
                new PageTitle { Id = 19, Key = "vision_section_title", PageName = "الرؤية", DefaultValue = "قسم الرؤية", CurrentValue = "قسم الرؤية", CreatedAt = seedDate },
                new PageTitle { Id = 20, Key = "vision_top_visions", PageName = "الرؤية", DefaultValue = "أبرز الرؤى", CurrentValue = "أبرز الرؤى", CreatedAt = seedDate },
                new PageTitle { Id = 21, Key = "vision_manage_title", PageName = "الرؤية", DefaultValue = "إدارة الرؤية", CurrentValue = "إدارة الرؤية", CreatedAt = seedDate },
                new PageTitle { Id = 22, Key = "vision_list_title", PageName = "الرؤية", DefaultValue = "قائمة الرؤية", CurrentValue = "قائمة الرؤية", CreatedAt = seedDate },
                // Message
                new PageTitle { Id = 23, Key = "message_page_title", PageName = "الرسائل", DefaultValue = "رسائلنا", CurrentValue = "رسائلنا", CreatedAt = seedDate },
                new PageTitle { Id = 24, Key = "message_section_title", PageName = "الرسائل", DefaultValue = "قسم الرسائل", CurrentValue = "قسم الرسائل", CreatedAt = seedDate },
                new PageTitle { Id = 25, Key = "message_top_messages", PageName = "الرسائل", DefaultValue = "أبرز الرسائل", CurrentValue = "أبرز الرسائل", CreatedAt = seedDate },
                new PageTitle { Id = 26, Key = "message_manage_title", PageName = "الرسائل", DefaultValue = "إدارة الرسائل", CurrentValue = "إدارة الرسائل", CreatedAt = seedDate },
                new PageTitle { Id = 27, Key = "message_list_title", PageName = "الرسائل", DefaultValue = "قائمة الرسائل", CurrentValue = "قائمة الرسائل", CreatedAt = seedDate },
                // Plans
                new PageTitle { Id = 28, Key = "plans_title", PageName = "الخطط", DefaultValue = "الخطط الاستراتيجية", CurrentValue = "الخطط الاستراتيجية", CreatedAt = seedDate },
                new PageTitle { Id = 29, Key = "plans_description", PageName = "الخطط", DefaultValue = "وصف الخطط الاستراتيجية", CurrentValue = "وصف الخطط الاستراتيجية", CreatedAt = seedDate },
                // Analysis
                new PageTitle { Id = 30, Key = "analysis_title", PageName = "التحليل", DefaultValue = "مرحلة التحليل", CurrentValue = "مرحلة التحليل", CreatedAt = seedDate },
                new PageTitle { Id = 31, Key = "analysis_description", PageName = "التحليل", DefaultValue = "وصف مرحلة التحليل", CurrentValue = "وصف مرحلة التحليل", CreatedAt = seedDate },
                // Direction
                new PageTitle { Id = 32, Key = "direction_title", PageName = "التوجهات", DefaultValue = "مرحلة التوجهات", CurrentValue = "مرحلة التوجهات", CreatedAt = seedDate },
                new PageTitle { Id = 33, Key = "direction_description", PageName = "التوجهات", DefaultValue = "وصف مرحلة التوجهات", CurrentValue = "وصف مرحلة التوجهات", CreatedAt = seedDate },
                // Objectives
                new PageTitle { Id = 34, Key = "objectives_title", PageName = "الأهداف الاستراتيجية", DefaultValue = "مرحلة الأهداف", CurrentValue = "مرحلة الأهداف", CreatedAt = seedDate },
                new PageTitle { Id = 35, Key = "objectives_description", PageName = "الأهداف الاستراتيجية", DefaultValue = "وصف مرحلة الأهداف", CurrentValue = "وصف مرحلة الأهداف", CreatedAt = seedDate },
                // Initiatives
                new PageTitle { Id = 36, Key = "initiatives_title", PageName = "المبادرات", DefaultValue = "مرحلة المبادرات", CurrentValue = "مرحلة المبادرات", CreatedAt = seedDate },
                new PageTitle { Id = 37, Key = "initiatives_description", PageName = "المبادرات", DefaultValue = "وصف مرحلة المبادرات", CurrentValue = "وصف مرحلة المبادرات", CreatedAt = seedDate },
                // Projects
                new PageTitle { Id = 38, Key = "projects_title", PageName = "المشاريع", DefaultValue = "مرحلة المشاريع", CurrentValue = "مرحلة المشاريع", CreatedAt = seedDate },
                new PageTitle { Id = 39, Key = "projects_description", PageName = "المشاريع", DefaultValue = "وصف مرحلة المشاريع", CurrentValue = "وصف مرحلة المشاريع", CreatedAt = seedDate },
                // Reports
                new PageTitle { Id = 40, Key = "reports_title", PageName = "التقارير", DefaultValue = "التقارير", CurrentValue = "التقارير", CreatedAt = seedDate },
                new PageTitle { Id = 41, Key = "reports_description", PageName = "التقارير", DefaultValue = "وصف اهداف الخطة الاستراتيجية", CurrentValue = "وصف اهداف الخطة الاستراتيجية", CreatedAt = seedDate },
                new PageTitle { Id = 42, Key = "reports_completion", PageName = "التقارير", DefaultValue = "نسبة الانجاز", CurrentValue = "نسبة الانجاز", CreatedAt = seedDate },
                new PageTitle { Id = 43, Key = "reports_collective_template", PageName = "التقارير", DefaultValue = "النموذج المجمع", CurrentValue = "النموذج المجمع", CreatedAt = seedDate },
                new PageTitle { Id = 44, Key = "reports_collective_report", PageName = "التقارير", DefaultValue = "التقرير المجمع", CurrentValue = "التقرير المجمع", CreatedAt = seedDate },
                new PageTitle { Id = 45, Key = "reports_unit_name", PageName = "التقارير", DefaultValue = "اسم الوحدة", CurrentValue = "اسم الوحدة", CreatedAt = seedDate },
                new PageTitle { Id = 46, Key = "reports_completion_percentage", PageName = "التقارير", DefaultValue = "نسبة الإنجاز", CurrentValue = "نسبة الإنجاز", CreatedAt = seedDate },
                new PageTitle { Id = 47, Key = "reports_goals", PageName = "التقارير", DefaultValue = "الأهداف", CurrentValue = "الأهداف", CreatedAt = seedDate },
                new PageTitle { Id = 48, Key = "reports_initiatives", PageName = "التقارير", DefaultValue = "المبادرات", CurrentValue = "المبادرات", CreatedAt = seedDate },
                new PageTitle { Id = 49, Key = "reports_projects", PageName = "التقارير", DefaultValue = "المشاريع", CurrentValue = "المشاريع", CreatedAt = seedDate },
                new PageTitle { Id = 50, Key = "reports_total_summary", PageName = "التقارير", DefaultValue = "إجمالي نسبة الإنجاز لجميع الوحدات", CurrentValue = "إجمالي نسبة الإنجاز لجميع الوحدات", CreatedAt = seedDate }
            );
        }
        #endregion
    }
}
