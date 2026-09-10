namespace Mod.APIs.Extensions
{
    public static class AuthorizationPolicies
    {
        public static void ConfigurePolicies(AuthorizationOptions options)
        {
            // Admin Policy
            options.AddPolicy(Roles.Admin, policy =>
            {
                policy.RequireRole(Roles.Admin);
                policy.RequireClaim(Roles.Admin); 
                policy.Requirements.Add(new AllowAllRequirement());
            });

            options.AddPolicy(Roles.Admin, policy => policy.RequireClaim(Roles.Admin));

            #region Modules
            var Modules = GetConstants(typeof(Modules));

            foreach (var module in Modules)
            {
                AddModulePolicies(options, module);
            }
            #endregion

        }

        private static void AddModulePolicies(AuthorizationOptions options, string module)
        {
            var permissions = GetConstants(typeof(Permissions));

            foreach (var permission in permissions)
            {
                options.AddPolicy($"{module}.{permission}", policy =>
                    policy.RequireClaim(module, permission));
            }
        }

        private static List<string> GetConstants(Type type) // Take a Type as a parameter
        {
            FieldInfo[] fields = type.GetFields(BindingFlags.Public | BindingFlags.Static);
            return fields.Select(field => field.GetValue(null) as string).ToList();
        }
    }

    public class AllowAllRequirement : IAuthorizationRequirement { }
    public class AllowAllHandler : AuthorizationHandler<AllowAllRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, AllowAllRequirement requirement)
        {
            if (context.User.HasClaim(c => c.Type == Roles.Admin))
            {
                context.Succeed(requirement);
            }
            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Bypasses ALL authorization requirements for HighManagement and Admin roles
    /// </summary>
    public class HighManagementBypassHandler : IAuthorizationHandler
    {
        public Task HandleAsync(AuthorizationHandlerContext context)
        {
            var user = context.User;
            if (user.IsInRole(Roles.HighManagement) || user.IsInRole(Roles.Admin))
            {
                foreach (var requirement in context.PendingRequirements.ToList())
                {
                    context.Succeed(requirement);
                }
            }
            return Task.CompletedTask;
        }
    }
}
