global using System.Linq.Expressions;
global using System.Reflection;
global using System.Security.Claims;
global using System.Text;
global using Microsoft.AspNetCore.Authentication.JwtBearer;
global using Microsoft.AspNetCore.Authorization;
global using Microsoft.AspNetCore.Identity;
global using Microsoft.AspNetCore.Mvc;
global using Microsoft.EntityFrameworkCore;
global using Microsoft.IdentityModel.Tokens;
global using Mod.APIs.DTOs.Auth;
global using Mod.APIs.Extensions;
global using Mod.APIs.Helpers;
global using Mod.Core.DTOs.AnalysisPoints;
global using Mod.Core.DTOs.APIsResponse;
global using Mod.Core.DTOs.APIsResponse.Auth;
global using Mod.Core.DTOs.Auth;
global using Mod.Core.DTOs.DirectionItems;
global using Mod.Core.DTOs.DirectionItemsElements;
global using Mod.Core.DTOs.Initiatives;
global using Mod.Core.DTOs.PlanDirection;
global using Mod.Core.DTOs.PlanGoals;
global using Mod.Core.DTOs.PlanProjects;
global using Mod.Core.DTOs.Plans;
global using Mod.Core.DTOs.Units;
global using Mod.Core.DTOs.Users;
global using Mod.Core.Entities;
global using Mod.Core.Entities.Identity;
global using Mod.Core.Entities.StrategicPlan;
global using Mod.Core.Enums;
global using Mod.Core.RepositoriesContract;
global using Mod.Core.Services.Contract.AnalysisPointsService;
global using Mod.Core.Services.Contract.AuthService;
global using Mod.Core.Services.Contract.DirectionItemsElementsService;
global using Mod.Core.Services.Contract.DirectionItemsService;


global using Mod.Core.Services.Contract.NotificationService;
global using Mod.Core.Services.Contract.PlanAnalysisService;
global using Mod.Core.Services.Contract.PlanDirectionService;

global using Mod.Core.Services.Contract.PlanService;
global using Mod.Core.Services.Contract.PlansService;

global using Mod.Core.Services.Contract.UnitsService;
global using Mod.Core.Services.Contract.UserService;
global using Mod.Core.UnitOffWorkContract;
global using Mod.Repository.Data;
global using Mod.Repository.Implement.Repositories;
global using Mod.Repository.UnitOfWorkImplement;

global using Mod.Service.Services.Implementation.AnalysisPointsService;
global using Mod.Service.Services.Implementation.Auth.Service;
global using Mod.Service.Services.Implementation.CurrentUserService;
global using Mod.Service.Services.Implementation.DirectionItemsElementsService;


global using Mod.Service.Services.Implementation.PlanAnalysisService;



global using Mod.Service.Services.Implementation.PlanService;
global using Mod.Service.Services.Implementation.PlansService;

global using Mod.Service.Services.Implementation.UnitsService;
global using Mod.Service.Services.Implementation.UserService;
global using static Mod.APIs.Helpers.AuthConstants;
