using Mod.Core.Services.Contract;
using Mod.Core.Services.Contract.NotificationService;
using Mod.Service.Services.Implementation.ReportService;

namespace Mod.APIs.Extensions
{
    public static class ApplicationServicesExtension
    {
        public static void AddApplicationServices(this IServiceCollection services)
        {
            services.AddHttpContextAccessor();

            services.AddIdentity<AppUser, UserRole>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequiredLength = 1;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.Password.RequiredUniqueChars = 0;
            })


            .AddEntityFrameworkStores<ModContext>().AddDefaultTokenProviders();

            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<INotificationService, Mod.APIs.Services.NotificationService>();
            services.AddScoped<IAnalysisPointsRepository, AnalysisPointsRepository>();
            services.AddScoped<IPlanAnalysisRepository, PlanAnalysisRepository>();
            services.AddScoped<IPlansRepository, PlansRepository>();
            services.AddScoped<IUnitRepository, UnitsRepository>();
            services.AddScoped<IReportRepository, ReportRepository>();
            services.AddScoped<IReportService, ReportService>();
            services.AddScoped<IPlanMasterRepository, PlanMasterRepository>();
            services.AddScoped<IPlanService, PlansService>();
            services.AddScoped<IMasterPlanService, MasterPlanService>();
            services.AddScoped<ICurrentUserService, CurrentUserService>();
            services.AddScoped<IAnalysisPointsService, AnalysisPointsService>();
            services.AddScoped<IPlanAnalysisService, PlanAnalysisService>();
            //services.AddScoped<IDirectionItemsService, DirectionItemsService>();
            services.AddScoped<IDirectionItemsElementsService, DirectionItemsElementsService>();
            //services.AddScoped<IPlanDirectionService, PlanDirectionService>();
            services.AddScoped<IDirectionItemsRepository, DirectionItemsRepository>();
            services.AddScoped<IDirectionItemsElementsRepository, DirectionItemsElementsRepository>();
            services.AddScoped<IPlanDirectionRepository, PlanDirectionRepository>();
           // services.AddScoped<IPlanGoalsRepository, PlanGoalsRepository>();
           // services.AddScoped<IGoalItemsRepository, GoalItemsRepository>();
            ////services.AddScoped<IPlanGoalsService, PlanGoalsService>();
           // services.AddScoped<IGoalItemsService, GoalItemsService>();
           // services.AddScoped<IInitiativesRepository, InitiativesRepository>();
           // services.AddScoped<IInitiativesService, InitiativesService>();
           // services.AddScoped<IPlanProjectsRepository, PlanProjectsRepository>();
           // services.AddScoped<IProjectItemsRepository, ProjectItemsRepository>();
           // services.AddScoped<IReportRepository, ReportRepository>();
           
           // services.AddScoped<IPlanProjectsService, PlanProjectsService>();
            services.AddScoped<IUnitsService, UnitService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IUserClaimsService, UserClaimsService>();


            services.AddScoped<IRoleAndPermissionsRepository, RoleAndPermissionsRepository>();
            services.AddScoped<IRoleAndPermissionsService, RoleAndPermissionsService>();

            // HighManagement & Admin bypass all permission checks
            services.AddSingleton<IAuthorizationHandler, HighManagementBypassHandler>();
        }
    }
}
