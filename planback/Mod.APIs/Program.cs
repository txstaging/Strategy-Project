using QuestPDF.Infrastructure;

namespace Mod.APIs
{
    public class Program
	{
		public static void Main(string[] args)
		{
			var builder = WebApplication.CreateBuilder(args);

			var allowedOrigins = new[]
			{
				"http://localhost:4200",
				"https://mod-sa.dev-env.live",
                "https://sac-maintenance-portal.vercel.app",
                "http://localhost:56808",
                "http://localhost:83",



                "http://localhost:56533",
                "https://jawdaportal.web.app"
            };

			builder.Services.AddCors(options =>
			{
				options.AddPolicy("AllowSpecificOrigins",
					policy => policy.WithOrigins(allowedOrigins)
									.AllowAnyHeader()
									.AllowAnyMethod()
									.AllowCredentials());
			});
            builder.Services.AddSignalR()
                .AddJsonProtocol(options =>
                {
                    options.PayloadSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
                });


            QuestPDF.Settings.License = LicenseType.Community;

            QuestPDF.Drawing.FontManager.RegisterFont(
                File.OpenRead(Path.Combine("wwwroot/Fonts", "Cairo-Regular.ttf"))
            );

            QuestPDF.Drawing.FontManager.RegisterFont(
                File.OpenRead(Path.Combine("wwwroot/Fonts", "Cairo-Bold.ttf"))
            );

            // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
            builder.Services.AddOpenApi();
			builder.Services.AddDbContextPool<ModContext>(options =>
			{
				options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
				//options.UseSqlServer(builder.Configuration.GetConnectionString("Local"));
			});

			builder.Services.AddApplicationServices();

			// Add AutoMapper
			builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

			builder.Services.AddAuthentication(options =>
				{
					options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
					options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
				})
				.AddJwtBearer(options =>
				{
					options.TokenValidationParameters = new TokenValidationParameters
					{
						ValidateIssuer = false,
						ValidateAudience = false,
						ValidateLifetime = true,
						ValidateIssuerSigningKey = true,
						ValidIssuer = builder.Configuration["Jwt:Issuer"],
						ValidAudience = builder.Configuration["Jwt:Audience"],
						IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
					};
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];

                            // ���� �� ����� ���� ��� ��� Hub
                            var path = context.HttpContext.Request.Path;
                            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationHub"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };

                });

			// Add Authorization
			builder.Services.AddAuthorization(options =>
			{ 
				AuthorizationPolicies.ConfigurePolicies(options);
            });

			// Add Controllers
			builder.Services.AddControllers()
				.AddJsonOptions(options =>
				{
					options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
				});

			var app = builder.Build();
           
           app.MapHub<NotificationHub>("/notificationHub");


            app.UseCors("AllowSpecificOrigins");
			app.UseStaticFiles();

            // Configure the HTTP request pipeline.
            //if (app.Environment.IsDevelopment())
            //{
            //	app.MapOpenApi();
            //	app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "Mod.Rawaq"));
            //}
            app.MapOpenApi();
            app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "Mod.Rawaq"));
            // Use Authentication and Authorization Middleware
            app.UseAuthentication();
			app.UseAuthorization();

			app.UseStatusCodePages(async context =>
			{
				var response = context.HttpContext.Response;
				if (response.StatusCode == 401)
				{
					response.ContentType = "application/json";
					await response.WriteAsJsonAsync(new
					{
						status = 401,
						message = "غير مصرح - يرجى تسجيل الدخول",
						messageEn = "Unauthorized - Please login"
					});
				}
				else if (response.StatusCode == 403)
				{
					response.ContentType = "application/json";
					await response.WriteAsJsonAsync(new
					{
						status = 403,
						message = "ليس لديك صلاحية للوصول إلى هذا المورد",
						messageEn = "Forbidden - You do not have permission to access this resource"
					});
				}
			});

			app.MapControllers();

			app.Run();
		}
	}
}
