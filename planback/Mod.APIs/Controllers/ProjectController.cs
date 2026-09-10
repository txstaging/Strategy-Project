using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Mod.Core.Entities.Identity;
using Mod.Core.Mapping.PlanDirection;
using Mod.Core.Utils;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;
        private readonly IMapper _mapper;
        private readonly INotificationService _notification;

        public ProjectController(ModContext context,ICurrentUserService currentUser,IMapper mapper,INotificationService notificationService)
        {
           _context = context;
          _currentUser = currentUser;
            _mapper = mapper;
            _notification = notificationService;
        }
        [Authorize(Policy = "Projects.Approve")]
        [HttpPost("Convert/{PlanId}")]
        public async Task<IActionResult> SubmitProjects(int PlanId)
        {
            var plan = await _context.PlanProjects.Where(i => i.PlanId == PlanId).ToListAsync();
            var user = await _currentUser.GetCurrentUserAsync();
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
            foreach (var i in plan)
            {
                if (i.Status == ApprovalStatus.SavedAsDraft)
                {
                    i.Status = ApprovalStatus.Pending;
                    _context.PlanProjects.Update(i);
                 
                }
            }
            await _context.SaveChangesAsync();
            await _notification.NotifyAsync(NotificationAction.Submit, ModulesNamesOnArabic.Project, unit, FormNameToReturnToFront.project, PlanId, RoleEnum.UnitEmployee);
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Projects.Add")]
        [HttpPost("{PlanId}")]
        public async Task<IActionResult> Add(ICollection< AddPlanProjectDto> obj, int PlanId)
        {
            foreach (var item in obj)
            {
                var plan = await _context.Plans.Where(i=>i.Id==PlanId).Include(i=>i.Units).Include(i=>i.PlanProjectsStep).FirstOrDefaultAsync(i=>i.Id==PlanId);
                if (plan is null)
                    return NotFound(new {Message="not found"});

                var goal = await _context.PlanGoals.Where(i => i.Id == item.PlanGoalsId).FirstOrDefaultAsync(i => i.Id == item.PlanGoalsId);
                if (goal is null)
                    return NotFound(new { Message = "not found" });

                var initiative = await _context.PlanInitiatives.Where(i=>i.Id==item.PlanInitiativeId).Include(i=>i.PlanProjects).ThenInclude(i=>i.Weight).FirstOrDefaultAsync(i=>i.Id==item.PlanInitiativeId);
                if (initiative is null)
                    return NotFound(new { Message = "not found" });
                var user= await _currentUser.GetCurrentUserAsync();



                string[] dateFormats = { "yyyy-MM-dd", "yyyy/MM/dd", "dd/MM/yyyy", "MM/dd/yyyy" };
                DateTime startDate, endDate;

                if (!DateTime.TryParseExact(item.StartDate, dateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out startDate))
                    return BadRequest(new { message= "Invalid StartDate format. Expected formats: yyyy-MM-dd or yyyy/MM/dd" });

                if (!DateTime.TryParseExact(item.EndDate, dateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out endDate))
                    return BadRequest(new { message = "Invalid StartDate format. Expected formats: yyyy-MM-dd or yyyy/MM/dd" });
                startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
                endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);
                var SumOfProjectWeight = initiative.PlanProjects.Sum(i =>double.Parse(i.Weight.Value));
             bool t=   double.Parse(item.Weight)+SumOfProjectWeight>initiative.InitiativeWeight;
                if(t) return BadRequest(new { message = "The sum of projects weights exceeds the initiative weight." });
                var planProject = new PlanProjects
                {
                    Plan = plan,
                    PlanId = PlanId,
                    UnitId = plan.UnitId,
                    Status=ApprovalStatus.Pending,
                    Units = plan.Units,
                    User = user,
                    AppUserId=user.Id,
                   
                    PlanInitiativeId = initiative.Id,
                    Initiative = initiative,
                    Name = new ProjectItems { Value = item.Name },
                    Priority = new ProjectItems { Value = item.Priority },
                    Duration = new ProjectItems { Value = item.Duration },
                    Beneficiaries = new ProjectItems { Value = item.Beneficiaries },
                    SupervisingAuthority = new ProjectItems { Value = item.SupervisingAuthority },
                    Weight = new ProjectItems { Value = item.Weight },
                    Percentage = new ProjectItems { Value = item.Percentage ?? "0" },
                    StartDateItem = new ProjectItems { Value = item.StartDate },
                    EndDateItem = new ProjectItems { Value = item.EndDate },
                    planProjectsStep = plan.PlanProjectsStep,
                    planProjectsStepId = (int)plan.planProjectsStepId,

                    Code = item.Code,
                    PlanGoalsId = goal.Id,
                    Goals = goal,
                    StartDate = startDate,
                    EndDate = endDate
                };
                planProject.Status=Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
                goal.GoalWeight += double.Parse(item.Weight);
                _context.PlanGoals.Update(goal);

                _context.PlanProjects.Add(planProject);

            }
            _context.SaveChanges();

            return Ok( new APIsGenralResponseDto<AddPlanProjectDto>("Added Successfully", null));
        }
        [Authorize(Policy = "Projects.Update")]
        [HttpPost]
        public async Task<IActionResult> Update(UpdatePlanProjectDto obj)

        {
            var project = await _context.PlanProjects.Where(i => i.Id == obj.Id).Include(i=>i.Name)
                .Include(i=>i.Priority)
                .Include(i=>i.Duration)
                .Include(i=>i.Beneficiaries)
                .Include(i=>i.planProjectsStep)
                .Include(i=>i.SupervisingAuthority)
                .Include(i=>i.Initiative)
                .ThenInclude(i=>i.PlanProjects)
                .ThenInclude(i=>i.Weight)
                .Include(i=>i.Weight)
                .Include(i=>i.StartDateItem)
                .Include(i=>i.EndDateItem)
                .Include(i=>i.Percentage).FirstOrDefaultAsync(i => i.Id == obj.Id);
            var goal = await _context.PlanGoals.Where(i => i.Id == obj.PlanGoalsId).FirstOrDefaultAsync(i => i.Id == obj.PlanGoalsId);
            goal.GoalWeight -= double.Parse(project.Weight.Value);
            _context.PlanGoals.Update(goal);
            if (project is null) return null;
            string[] dateFormats = { "yyyy-MM-dd", "yyyy/MM/dd", "dd/MM/yyyy", "MM/dd/yyyy" };
            DateTime startDate, endDate;

            if (!DateTime.TryParseExact(obj.StartDate, dateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out startDate))
                return BadRequest(new { message = "Invalid StartDate format. Expected formats: yyyy-MM-dd or yyyy/MM/dd" });

            if (!DateTime.TryParseExact(obj.EndDate, dateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out endDate))
                return BadRequest(new { message = "Invalid StartDate format. Expected formats: yyyy-MM-dd or yyyy/MM/dd" });
            if(project.Beneficiaries.Status==ApprovalStatus.ReturnedByHighManagement || project.Beneficiaries.Status == ApprovalStatus.ReturnedByRegionManager || project.Beneficiaries.Status == ApprovalStatus.ReturnedByUnitManager
                || project.Beneficiaries.Status==ApprovalStatus.RejectedByHighManagement || project.Beneficiaries.Status == ApprovalStatus.RejectedByRegionManager || project.Beneficiaries.Status == ApprovalStatus.RejectedByUnitManager)
            {
                project.Beneficiaries.Status = ApprovalStatus.Pending;
                _context.ProjectItems.Update(project.Beneficiaries);
            }
            if (project.Duration.Status == ApprovalStatus.ReturnedByHighManagement || project.Duration.Status == ApprovalStatus.ReturnedByRegionManager || project.Duration.Status == ApprovalStatus.ReturnedByUnitManager
                || project.Duration.Status == ApprovalStatus.RejectedByHighManagement || project.Duration.Status == ApprovalStatus.RejectedByRegionManager || project.Duration.Status == ApprovalStatus.RejectedByUnitManager)
            {
                project.Duration.Status = ApprovalStatus.Pending;
                _context.ProjectItems.Update(project.Duration);
            }
            if (project.Name.Status == ApprovalStatus.ReturnedByHighManagement || project.Name.Status == ApprovalStatus.ReturnedByRegionManager || project.Name.Status == ApprovalStatus.ReturnedByUnitManager
                || project.Name.Status == ApprovalStatus.RejectedByHighManagement || project.Name.Status == ApprovalStatus.RejectedByRegionManager || project.Name.Status == ApprovalStatus.RejectedByUnitManager)
            {
                project.Name.Status = ApprovalStatus.Pending;
                _context.ProjectItems.Update(project.Name);
            }
            if (project.Priority.Status == ApprovalStatus.ReturnedByHighManagement || project.Priority.Status == ApprovalStatus.ReturnedByRegionManager || project.Priority.Status == ApprovalStatus.ReturnedByUnitManager
                || project.Priority.Status == ApprovalStatus.RejectedByHighManagement || project.Priority.Status == ApprovalStatus.RejectedByRegionManager || project.Priority.Status == ApprovalStatus.RejectedByUnitManager)
            {
                project.Priority.Status = ApprovalStatus.Pending;
                _context.ProjectItems.Update(project.Priority);
            }
            if (project.SupervisingAuthority.Status == ApprovalStatus.ReturnedByHighManagement || project.SupervisingAuthority.Status == ApprovalStatus.ReturnedByRegionManager || project.SupervisingAuthority.Status == ApprovalStatus.ReturnedByUnitManager
                || project.SupervisingAuthority.Status == ApprovalStatus.RejectedByHighManagement || project.SupervisingAuthority.Status == ApprovalStatus.RejectedByRegionManager || project.SupervisingAuthority.Status == ApprovalStatus.RejectedByUnitManager)
            {
                project.SupervisingAuthority.Status = ApprovalStatus.Pending;
                _context.ProjectItems.Update(project.SupervisingAuthority);
            }
            if (project.Percentage != null && (project.Percentage.Status == ApprovalStatus.ReturnedByHighManagement || project.Percentage.Status == ApprovalStatus.ReturnedByRegionManager || project.Percentage.Status == ApprovalStatus.ReturnedByUnitManager
                || project.Percentage.Status == ApprovalStatus.RejectedByHighManagement || project.Percentage.Status == ApprovalStatus.RejectedByRegionManager || project.Percentage.Status == ApprovalStatus.RejectedByUnitManager))
            {
                project.Percentage.Status = ApprovalStatus.Pending;
                _context.ProjectItems.Update(project.Percentage);
            }

            startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
            endDate = DateTime.SpecifyKind(endDate, DateTimeKind.Utc);
            project.Name.Value = obj.Name;
            project.Priority.Value = obj.Priority;
            project.Duration.Value = obj.Duration;
            project.Beneficiaries.Value = obj.Beneficiaries;
            project.SupervisingAuthority.Value = obj.SupervisingAuthority;
            
            project.Code = obj.Code;
            project.StartDate = startDate;
            project.Goals = await _context.PlanGoals.Where(i => i.Id == obj.PlanGoalsId).FirstOrDefaultAsync(i => i.Id == obj.PlanGoalsId);
            project.Initiative = await _context.PlanInitiatives.Where(i => i.Id == obj.PlanInitiativeId).Include(i => i.PlanProjects).FirstOrDefaultAsync(i => i.Id == obj.PlanInitiativeId);
            project.EndDate = endDate;
            var SumOfProjectWeight = project.Initiative.PlanProjects.Sum(i => double.Parse(i.Weight.Value));
            SumOfProjectWeight -= double.Parse(project.Weight.Value);
            bool t = double.Parse(obj.Weight) + SumOfProjectWeight > project.Initiative.InitiativeWeight;
            if (t) return BadRequest(new { message = "The sum of projects weights exceeds the initiative weight." });
            project.Weight.Value = obj.Weight;
            if (obj.Percentage != null && project.Percentage != null)
            {
                project.Percentage.Value = obj.Percentage;
            }
            // Keep the approvable date items in sync with the edited dates
            // (create them for older projects that don't have them yet).
            if (project.StartDateItem == null)
            {
                project.StartDateItem = new ProjectItems { Value = obj.StartDate };
            }
            else
            {
                project.StartDateItem.Value = obj.StartDate;
                if (project.StartDateItem.Status == ApprovalStatus.ReturnedByHighManagement || project.StartDateItem.Status == ApprovalStatus.ReturnedByRegionManager || project.StartDateItem.Status == ApprovalStatus.ReturnedByUnitManager
                    || project.StartDateItem.Status == ApprovalStatus.RejectedByHighManagement || project.StartDateItem.Status == ApprovalStatus.RejectedByRegionManager || project.StartDateItem.Status == ApprovalStatus.RejectedByUnitManager)
                {
                    project.StartDateItem.Status = ApprovalStatus.Pending;
                }
                _context.ProjectItems.Update(project.StartDateItem);
            }
            if (project.EndDateItem == null)
            {
                project.EndDateItem = new ProjectItems { Value = obj.EndDate };
            }
            else
            {
                project.EndDateItem.Value = obj.EndDate;
                if (project.EndDateItem.Status == ApprovalStatus.ReturnedByHighManagement || project.EndDateItem.Status == ApprovalStatus.ReturnedByRegionManager || project.EndDateItem.Status == ApprovalStatus.ReturnedByUnitManager
                    || project.EndDateItem.Status == ApprovalStatus.RejectedByHighManagement || project.EndDateItem.Status == ApprovalStatus.RejectedByRegionManager || project.EndDateItem.Status == ApprovalStatus.RejectedByUnitManager)
                {
                    project.EndDateItem.Status = ApprovalStatus.Pending;
                }
                _context.ProjectItems.Update(project.EndDateItem);
            }
            if(project.Status == ApprovalStatus.ReturnedByUnitManager||project.Status==ApprovalStatus.ReturnedByRegionManager||project.Status==ApprovalStatus.ReturnedByHighManagement
                ||project.Status == ApprovalStatus.RejectedByUnitManager||project.Status==ApprovalStatus.RejectedByRegionManager||project.Status==ApprovalStatus.RejectedByHighManagement)
            {
                project.planProjectsStep.Status = ApprovalStatus.Pending;
                project.Status = ApprovalStatus.Pending;
                _context.PlanProjectsStep.Update(project.planProjectsStep);
            }
            goal.GoalWeight += double.Parse(obj.Weight);
            _context.PlanGoals.Update(goal);
            _context.PlanProjects.Update(project);
           await _context.SaveChangesAsync();
            return Ok(new {message ="ok"});
        }
        [Authorize(Policy = "Projects.GetOne")]
        [HttpGet("{id}")]
        public async Task<IActionResult>get(int id)
        {
            var project = await _context.PlanProjects.Where(i => i.Id == id)
                .Include(i=>i.SupervisingAuthority).Include(i=>i.Priority).Include(i=>i.Weight).Include(i=>i.Name).Include(i=>i.Duration).Include(i=>i.Beneficiaries).Include(i=>i.Percentage).Include(i=>i.StartDateItem).Include(i=>i.EndDateItem).Include(i=>i.Initiative).ThenInclude(i=>i.Name).Include(i=>i.Goals).ThenInclude(i=>i.Indicator).Include(i=>i.Goals).ThenInclude(i=>i.Descripition).Include(i=>i.Goals).ThenInclude(i=>i.Name).FirstOrDefaultAsync(i => i.Id == id);
            if (project is null) return NotFound();
            var PlanProjectAfterMapping = new GetPlanProjectsDto
            {
                Id = id,
                PlanGoals= _mapper.Map<GetAcceptableGoalsDto>(project.Goals),
                StartDate= DateOnly.FromDateTime(project.StartDate).ToString(),
                EndDate=DateOnly.FromDateTime(project.EndDate).ToString(),

                // Fix for CS0030: Cannot convert type 'string' to 'Mod.Core.Enums.ApprovalStatus'
                // The issue is caused by attempting to cast a string to an enum directly. Instead, use Enum.Parse to convert the string to the enum type.

                Status = ((ApprovalStatus)project.Status).ToString(),


                Name = new ProjectItemsDto
                {
                    Id = project.Name.Id,
                    Value = project.Name.Value,
                    Status = project.Name.Status.HasValue ? project.Name.Status.Value.ToString() : null,
                    Comment=project.Name.Comment
                },
                Priority = new ProjectItemsDto
                {
                    Id = project.Priority.Id,
                    Value = project.Priority.Value,
                    Status = project.Priority.Status.HasValue ? project.Priority.Status.Value.ToString() : null,
                    Comment = project.Priority.Comment
                },
                Duration = new ProjectItemsDto
                {
                    Id = project.Duration.Id,
                    Value = project.Duration.Value,
                    Status = project.Duration.Status.HasValue ? project.Duration.Status.Value.ToString() : null,
                    Comment = project.Duration.Comment
                },
                Beneficiaries = new ProjectItemsDto
                {
                    Id = project.Beneficiaries.Id,
                    Value = project.Beneficiaries.Value,
                    Status = project.Beneficiaries.Status.HasValue ? project.Beneficiaries.Status.Value.ToString() : null,
                    Comment = project.Beneficiaries.Comment
                },
                SupervisingAuthority = new ProjectItemsDto
                {
                    Id = project.SupervisingAuthority.Id,
                    Value = project.SupervisingAuthority.Value,
                    Status = project.SupervisingAuthority.Status.HasValue ? project.SupervisingAuthority.Status.Value.ToString() : null,
                    Comment = project.SupervisingAuthority.Comment
                },
                Weight = new ProjectItemsDto
                {
                    Id = project.Weight.Id,
                    Value = project.Weight.Value,
                    Status = project.Weight.Status.HasValue ? project.Weight.Status.Value.ToString() : null,
                    Comment = project.Weight.Comment
                },
                Percentage = project.Percentage != null ? new ProjectItemsDto
                {
                    Id = project.Percentage.Id,
                    Value = project.Percentage.Value,
                    Status = project.Percentage.Status.HasValue ? project.Percentage.Status.Value.ToString() : null,
                    Comment = project.Percentage.Comment
                } : null,
                StartDateItem = project.StartDateItem != null ? new ProjectItemsDto
                {
                    Id = project.StartDateItem.Id,
                    Value = project.StartDateItem.Value,
                    Status = project.StartDateItem.Status.HasValue ? project.StartDateItem.Status.Value.ToString() : null,
                    Comment = project.StartDateItem.Comment
                } : null,
                EndDateItem = project.EndDateItem != null ? new ProjectItemsDto
                {
                    Id = project.EndDateItem.Id,
                    Value = project.EndDateItem.Value,
                    Status = project.EndDateItem.Status.HasValue ? project.EndDateItem.Status.Value.ToString() : null,
                    Comment = project.EndDateItem.Comment
                } : null,
                Code=project.Code,



            };
            PlanProjectAfterMapping.PlanInitiative = new 
            {
                project.Initiative.Id,
                project.Initiative.Name.Value


            };
            
            return Ok(PlanProjectAfterMapping);
        }
        [Authorize(Policy = "Projects.GetAll")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
          [FromQuery] int PlanId,
          [FromQuery] int Page = 1,
          [FromQuery] int PerPage = 5
       )
        {
            var user = await _currentUser.GetCurrentUserAsync();
             var goals = await _context.PlanProjects.Where(i => i.PlanId == PlanId).Include(i => i.Units).Include(i => i.User).Include(i=>i.Goals).ThenInclude(i=>i.Name).Include(i=>i.Name).Include(i=>i.Initiative).ToListAsync();
            goals = goals.Where(func.GetFilterProject(Enum.Parse<RoleEnum>(user!.Role!))).ToList();

            var totalCount = goals.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / PerPage);

            // Ensure the page is at least 1  
            Page = Page < 1 ? 1 : Page;

           

            var AllGoalsAfterMapping = goals.Select(i => new GetAllInitiativesDto
            {
                Id = i.Id,
                Status = i.Status.ToString(),
                name = i.Name.Value,

                Comment = i.Comment,
                
                EmployeeName = i.User!.DisplayName,
                Date = i.CreatedAt.HasValue ? i.CreatedAt.Value.ToString("yyyy-MM-dd") : string.Empty,
                UnitName = i.Units.Name,
                GoalName = i.Goals.Name.Value,
                InitiativeWeight = i.Initiative.InitiativeWeight,
            }).ToList();
            var metadata = new MetaDataDto
            {
                CurrentPage = Page,
                PerPage = PerPage,
                Total = totalCount,
                From = ((Page - 1) * PerPage) + 1,
                To = Math.Min(Page * PerPage, totalCount),
                LastPage = totalPages
            };

            return Ok(AllGoalsAfterMapping);
        }
        [Authorize(Policy = "Projects.Approve")]
        [HttpPost("ApproveProject/{id}")]
        public async Task<IActionResult> ApproveProject(int id)
        {
            var initiative = await _context.PlanProjects.FindAsync(id);
            if (initiative.Status == ApprovalStatus.ReturnedByUnitManager || initiative.Status == ApprovalStatus.ReturnedByHighManagement || initiative.Status == ApprovalStatus.ReturnedByRegionManager)
            {
                initiative.Status = ApprovalStatus.Pending;
                initiative.Comment = null;
            }
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiative == null) return NotFound("Initiative not found");
            initiative.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _context.PlanProjects.Update(initiative);
            await _context.SaveChangesAsync();

            return Ok(new { message = "ok" });

        }
        [Authorize(Policy = "Projects.Approve")]
        [HttpPost("ApproveItem/{id}")]
        public async Task<IActionResult> ApproveItem(int id)
        {
            var initiativeItem = await _context.ProjectItems.FindAsync(id);
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiativeItem == null) return NotFound("Initiative Item not found");
            initiativeItem.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _context.ProjectItems.Update(initiativeItem);
            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Projects.Reject")]
        [HttpPost("RejectItem/{ProjectId}/{ProjectItemId}")]
        public async Task<IActionResult> RejectItem(int ProjectId, int ProjectItemId, Comment comment)
        {
            var initiativeItem = await _context.ProjectItems.FindAsync(ProjectItemId);
            var initiative = await _context.PlanProjects.FindAsync(ProjectId);
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiativeItem == null) return NotFound("Initiative Item not found");
            initiativeItem.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Comment = comment.Comments;
            _context.PlanProjects.Update(initiative);
            initiativeItem.Comment = comment.Comments;
            _context.ProjectItems.Update(initiativeItem);
            await _context.SaveChangesAsync();
            var plan = await _context.Plans.Where(i => i.Id == initiative.PlanId).FirstOrDefaultAsync();
            // Notify the PLAN's unit (employee + unit manager), not the approver's unit.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Reject, ModulesNamesOnArabic.Project, unit, FormNameToReturnToFront.project, plan.Id, actingRole);
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Projects.Return")]
        [HttpPost("ReturnItem/{ProjectId}/{ProjectItemId}")]

        public async Task<IActionResult> ReturnItem(int ProjectId, int ProjectItemId, Comment comment)
        {
            var initiativeItem = await _context.ProjectItems.FindAsync(ProjectItemId);
            var initiative = await _context.PlanProjects.FindAsync(ProjectId);
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiativeItem == null) return NotFound("Initiative Item not found");
            initiativeItem.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Comment = comment.Comments;
            _context.PlanProjects.Update(initiative);
            initiativeItem.Comment = comment.Comments;
            _context.ProjectItems.Update(initiativeItem);
            await _context.SaveChangesAsync();
            var plan = await _context.Plans.Where(i => i.Id == initiative.PlanId).FirstOrDefaultAsync();
            // Notify the PLAN's unit (employee + unit manager), not the approver's unit.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Return, ModulesNamesOnArabic.Project, unit, FormNameToReturnToFront.project, plan.Id, actingRole);
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Projects.GetOne")]
        [HttpGet("ProjectStageStatus/{id}")]
        public async Task<IActionResult> GetInitiativeStageStatus(int id)
        {
            var i = await _context.Plans.Where(i => i.Id == id).Include(i => i.PlanProjectsStep).FirstOrDefaultAsync(i => i.Id == id);
            if (i == null) return NotFound("Initiative Stage not found");
            return Ok(new
            {
                i.PlanProjectsStep.Id,
                status = ((ApprovalStatus)i.PlanProjectsStep.Status).ToString(),

            });
        }
        [Authorize(Policy = "Projects.Approve")]
        [HttpPost("ApproveProjectStage/{id}")]
        public async Task<IActionResult> ApproveInitiativeStage(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var plan = await _context.Plans.Where(i => i.Id == id).Include(i => i.PlanProjectsStep).ThenInclude(i => i.Projects).ThenInclude(i=>i.Name)
                .Include(i=>i.PlanProjectsStep).ThenInclude(i=>i.Projects).ThenInclude(i=>i.Beneficiaries)
                .Include(i=>i.PlanProjectsStep).ThenInclude(i=>i.Projects).ThenInclude(i=>i.Duration)
                .Include(i=>i.PlanProjectsStep).ThenInclude(i=>i.Projects).ThenInclude(i=>i.Priority)
                .Include(i => i.PlanProjectsStep).ThenInclude(i => i.Projects).ThenInclude(i => i.Name)
                .Include(i=>i.PlanProjectsStep).ThenInclude(i=>i.Projects).ThenInclude(i=>i.SupervisingAuthority)
                .Include(i=>i.PlanProjectsStep).ThenInclude(i=>i.Projects).ThenInclude(i=>i.Weight)
                .Include(i=>i.PlanProjectsStep).ThenInclude(i=>i.Projects).ThenInclude(i=>i.Percentage)
                .Include(i=>i.PlanProjectsStep).ThenInclude(i=>i.Projects).ThenInclude(i=>i.StartDateItem)
                .Include(i=>i.PlanProjectsStep).ThenInclude(i=>i.Projects).ThenInclude(i=>i.EndDateItem).FirstOrDefaultAsync(i => i.Id == id);
            // Notify the PLAN's unit (employee + unit manager), not the approver's
            // unit — otherwise region/high management approvals never reach the
            // plan's employees.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);
            var projectStatuses = new List<ApprovalStatus?>();
            foreach (var p in plan.PlanProjectsStep.Projects)
            {
                projectStatuses.Add(p.Status);
                projectStatuses.Add(p.Name.Status);
                projectStatuses.Add(p.Beneficiaries.Status);
                projectStatuses.Add(p.Duration.Status);
                projectStatuses.Add(p.Priority.Status);
                projectStatuses.Add(p.SupervisingAuthority.Status);
                projectStatuses.Add(p.Weight.Status);
                if (p.Percentage != null) projectStatuses.Add(p.Percentage.Status);
                if (p.StartDateItem != null) projectStatuses.Add(p.StartDateItem.Status);
                if (p.EndDateItem != null) projectStatuses.Add(p.EndDateItem.Status);
            }
            if (projectStatuses.Any(s => Utils.IsRejectedOrReturned(s)))
            {
                return BadRequest(new { message = "لا يمكن اعتماد المرحلة لوجود عناصر مرفوضة أو مُرجعة أو لم يتم اتخاذ إجراء عليها بعد" });
            }
            foreach (var item in plan.PlanProjectsStep.Projects)
            {
                if (user.Role == RoleEnum.UnitManager.ToString())
                {
                    if (item.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.PlanProjects.Update(item);
                    }
                    if (item.Name.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Name.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.ProjectItems.Update(item.Name);
                    }
                    if (item.Beneficiaries.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Beneficiaries.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.ProjectItems.Update(item.Beneficiaries);
                    }
                    if (item.Duration.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Duration.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.ProjectItems.Update(item.Duration);
                    }
                    if (item.Priority.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Priority.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.ProjectItems.Update(item.Priority);
                    }
                    if (item.SupervisingAuthority.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.SupervisingAuthority.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.ProjectItems.Update(item.SupervisingAuthority);
                    }
                    if (item.Weight.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Weight.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.ProjectItems.Update(item.Weight);
                    }
                    if (item.Percentage != null && item.Percentage.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Percentage.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.ProjectItems.Update(item.Percentage);
                    }
                    if (item.StartDateItem != null && item.StartDateItem.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.StartDateItem.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.ProjectItems.Update(item.StartDateItem);
                    }
                    if (item.EndDateItem != null && item.EndDateItem.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.EndDateItem.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.ProjectItems.Update(item.EndDateItem);
                    }

                }
                if (user.Role == RoleEnum.RegionManager.ToString())
                {
                    if (item.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.PlanProjects.Update(item);
                    }
                    if (item.Name.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Name.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.ProjectItems.Update(item.Name);
                    }
                    if (item.Beneficiaries.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Beneficiaries.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.ProjectItems.Update(item.Beneficiaries);
                    }
                    if (item.Duration.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Duration.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.ProjectItems.Update(item.Duration);
                    }
                    if (item.Priority.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Priority.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.ProjectItems.Update(item.Priority);
                    }
                    if (item.SupervisingAuthority.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.SupervisingAuthority.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.ProjectItems.Update(item.SupervisingAuthority);
                    }
                    if (item.Weight.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Weight.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.ProjectItems.Update(item.Weight);
                    }
                    if (item.Percentage != null && item.Percentage.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Percentage.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.ProjectItems.Update(item.Percentage);
                    }
                    if (item.StartDateItem != null && item.StartDateItem.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.StartDateItem.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.ProjectItems.Update(item.StartDateItem);
                    }
                    if (item.EndDateItem != null && item.EndDateItem.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.EndDateItem.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.ProjectItems.Update(item.EndDateItem);
                    }
                }
                if (user.Role == RoleEnum.HighManagement.ToString())
                {
                    if (item.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.PlanProjects.Update(item);
                    }
                    if (item.Name.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Name.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.ProjectItems.Update(item.Name);
                    }
                    if (item.Beneficiaries.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Beneficiaries.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.ProjectItems.Update(item.Beneficiaries);
                    }
                    if (item.Duration.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Duration.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.ProjectItems.Update(item.Duration);
                    }
                    if (item.Priority.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Priority.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.ProjectItems.Update(item.Priority);
                    }
                    if (item.SupervisingAuthority.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.SupervisingAuthority.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.ProjectItems.Update(item.SupervisingAuthority);
                    }
                    if (item.Weight.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Weight.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.ProjectItems.Update(item.Weight);
                    }
                    if (item.Percentage != null && item.Percentage.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Percentage.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.ProjectItems.Update(item.Percentage);
                    }
                    if (item.StartDateItem != null && item.StartDateItem.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.StartDateItem.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.ProjectItems.Update(item.StartDateItem);
                    }
                    if (item.EndDateItem != null && item.EndDateItem.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.EndDateItem.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.ProjectItems.Update(item.EndDateItem);
                    }
                }

            }
            plan.PlanProjectsStep.Status = Utils.GetApprovalStatusV2(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _context.PlanProjectsStep.Update(plan.PlanProjectsStep);
            await _context.SaveChangesAsync();
            var notifAction = actingRole == RoleEnum.HighManagement ? NotificationAction.FinalApprove : NotificationAction.Approve;
            await _notification.NotifyAsync(notifAction, ModulesNamesOnArabic.Project, unit, FormNameToReturnToFront.project, plan.Id, actingRole);
            return Ok(new { message = "ok" });


        }
        [Authorize(Policy = "Projects.GetAll")]
        [HttpGet("GetAcceptableGoals/{id}")]
        public async Task<IActionResult> GetAcceptableGoals(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goals = await _context.PlanGoals.Where(i => i.PlanId == id && i.Status == ApprovalStatus.ApprovedByHighManagement).Include(i => i.Name).Include(i => i.Descripition).Include(i => i.Indicator).ToListAsync();
            if (goals == null) return NotFound("Goals not found");
            var result = goals.Select(i => new GetGoalsForInitiativeDto
            {
                Id = i.Id,
                Name = i.Name.Value,
                Descripition = i.Descripition.Value,
                Indicator = i.Indicator.Value,
            }).ToList();
            return Ok(result);
        }
        [Authorize(Policy = "Projects.GetAll")]
        [HttpGet("GetAcceptableInitiatives/{id}")]
        public async Task<IActionResult> GetAcceptableInitiatives(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goals = await _context.PlanInitiatives.Where(i => i.PlanId == id && i.Status == ApprovalStatus.ApprovedByHighManagement).Include(i=>i.Name).ToListAsync();
            if (goals == null) return NotFound("Goals not found");
            var result = goals.Select(i => new 
            {
                Id = i.Id,
                //Name = i.InitiativeItems.FirstOrDefault(i=>i.),
                name = i.Name.Value,
                InitiativeWeight = i.InitiativeWeight,


            }).ToList();
            return Ok(result);
        }

    }
}
