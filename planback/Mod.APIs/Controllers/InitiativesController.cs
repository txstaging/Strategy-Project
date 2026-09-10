using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Mod.Core.DTOs.Initiatives;
using Mod.Core.Entities.Initiative;
using Mod.Core.Entities.StrategicPlan;
using Mod.Core.Utils;
using QuestPDF.Infrastructure;
using System.Linq;
using System.Numerics;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InitiativesController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;
        private readonly INotificationService _notification;

        public InitiativesController(ModContext context, ICurrentUserService currentUser,INotificationService notificationService)
        {
            _context = context;
            _currentUser = currentUser;
            _notification = notificationService;
        }
        [Authorize(Policy = "Initiative.Update")]
        [HttpPost("Convert/{PlanId}")]
        public async Task<IActionResult> Convert(int PlanId)
        {
            var initiatives = await _context.PlanInitiatives.Where(i => i.PlanId == PlanId).ToListAsync();
            var user = await _currentUser.GetCurrentUserAsync();
            var unit = user.Units;
            foreach (var i in initiatives)
            {
                if (i.Status == ApprovalStatus.SavedAsDraft)
                {
                    i.Status = ApprovalStatus.Pending;
                    _context.PlanInitiatives.Update(i);
                }
            }
            await _context.SaveChangesAsync();
            await _notification.NotifyAsync(NotificationAction.Submit, ModulesNamesOnArabic.Init, unit, FormNameToReturnToFront.init, PlanId, RoleEnum.UnitEmployee);
            return Ok(new { PlanID = PlanId });
        }
        [Authorize(Policy = "Initiative.Add")]
        [HttpPost("{PlanId}")]
        public async Task<IActionResult> Add([FromBody] ICollection<AddInitiativesDto> addInitiativesDto, int PlanId)
        {
            var plan = await _context.Plans.Where(i => i.Id == PlanId).Include(i => i.PlanInitiativeStep).FirstOrDefaultAsync(i => i.Id == PlanId);
            var user = await _currentUser.GetCurrentUserAsync();
            var unit = user.Units;
            foreach (var item in addInitiativesDto)
            {
                if (plan == null) return NotFound("Plan not found");
                var goal = await _context.PlanGoals.FindAsync(item.GoalId);
                if (goal == null) return NotFound("Goal not found");
                var initiative = new PlanInitiative
                {
                    GoalId = goal.Id,
                    Goal = goal,
                    PlanId = plan.Id,
                    UnitId = (int)user.UnitId,
                    Unit = user.Units,
                    User = user,
                    AppUserId = user.Id,
                    PlanInitiativeStepId = plan.planInitiativeStepId,
                    PlanInitiativeStep = plan.PlanInitiativeStep,
                    InitiativeWeight = (double)item.InitiativeWeight,
                    Name=new InitiativeItem { Status = ApprovalStatus.Pending, Value = item.name },

                    InitiativeItems = item.InitiativeItem.Select(x => new InitiativeItem
                    {
                        Value = x.Value,
                        Type = x.Type,
                        
                    }).ToList(),
                    InitiativeKpis = item.InitiativeKPIs.Select(x => new InitiativeKpi
                    {

                        Value = x.Value,
                    }).ToList()
                };
                initiative.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
                await _context.PlanInitiatives.AddAsync(initiative);
            }



            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Initiative.Update")]
        [HttpPost]
        public async Task<IActionResult> Update([FromBody] UpdateInitiativesDto updateInitiativesDto)
        {
            var initiative = await _context.PlanInitiatives
                .Include(i => i.InitiativeItems)
                .Include(i => i.InitiativeKpis)
                .Include(i=>i.PlanInitiativeStep)
                .Include(i=>i.Name)
                .FirstOrDefaultAsync(i => i.Id == updateInitiativesDto.Id);
            if (initiative == null) return NotFound("Initiative not found");
            initiative.GoalId = updateInitiativesDto.GoalId;
            initiative.Name.Value = updateInitiativesDto.Name.Value;

            // Fix: Parse the string to the ApprovalStatus enum  
            if (Enum.TryParse(updateInitiativesDto.Status, out ApprovalStatus status))
            {
                initiative.Status = status;
            }
            else
            {
                return BadRequest("Invalid status value");
            }

            initiative.Comment = updateInitiativesDto.Comment;
            foreach (var item in updateInitiativesDto.InitiativeItem)
            {
                var existingItem = initiative.InitiativeItems.FirstOrDefault(i => i.Id == item.Id);
                if (existingItem != null)
                {
                    if (existingItem.Status == ApprovalStatus.ReturnedByUnitManager || existingItem.Status == ApprovalStatus.ReturnedByRegionManager || existingItem.Status == ApprovalStatus.ReturnedByHighManagement
                        || existingItem.Status == ApprovalStatus.RejectedByUnitManager || existingItem.Status == ApprovalStatus.RejectedByRegionManager || existingItem.Status == ApprovalStatus.RejectedByHighManagement)
                    {
                        existingItem.Status = ApprovalStatus.Pending;
                        _context.InitiativeItems.Update(existingItem);

                    }
                        existingItem.Value = item.Value;

                }
                else
                {
                    initiative.InitiativeItems.Add(new InitiativeItem
                    {
                        Value = item.Value,
                        Type = item.Type
                    });
                }
            }
            foreach (var kpi in updateInitiativesDto.InitiativeKPIs)
            {
                var existingKpi = initiative.InitiativeKpis.FirstOrDefault(i => i.Id == kpi.Id);
                if (existingKpi != null)
                {
                    if(existingKpi.Status==ApprovalStatus.ReturnedByUnitManager|| existingKpi.Status == ApprovalStatus.ReturnedByRegionManager|| existingKpi.Status == ApprovalStatus.ReturnedByHighManagement
                        || existingKpi.Status==ApprovalStatus.RejectedByUnitManager|| existingKpi.Status == ApprovalStatus.RejectedByRegionManager|| existingKpi.Status == ApprovalStatus.RejectedByHighManagement)
                    {
                        existingKpi.Status = ApprovalStatus.Pending;
                        _context.InitiativeKpis.Update(existingKpi);
                    }
                    existingKpi.Value = kpi.Value;

                }
                else
                {
                    initiative.InitiativeKpis.Add(new InitiativeKpi
                    {
                        Value = kpi.Value,
                    });
                }
            }
            if(initiative.Status==ApprovalStatus.ReturnedByHighManagement || initiative.Status == ApprovalStatus.ReturnedByRegionManager || initiative.Status == ApprovalStatus.ReturnedByUnitManager
                || initiative.Status==ApprovalStatus.RejectedByHighManagement || initiative.Status == ApprovalStatus.RejectedByRegionManager || initiative.Status == ApprovalStatus.RejectedByUnitManager)
            {
                initiative.Status = ApprovalStatus.Pending;
                initiative.Comment = null;
                initiative.PlanInitiativeStep.Status = ApprovalStatus.Pending;
                _context.PlanInitiativeStep.Update(initiative.PlanInitiativeStep);
            }
            if(initiative.Name.Status == ApprovalStatus.ReturnedByHighManagement || initiative.Name.Status == ApprovalStatus.ReturnedByRegionManager || initiative.Name.Status == ApprovalStatus.ReturnedByUnitManager
                || initiative.Name.Status == ApprovalStatus.RejectedByHighManagement || initiative.Name.Status == ApprovalStatus.RejectedByRegionManager || initiative.Name.Status == ApprovalStatus.RejectedByUnitManager)
            {
                initiative.Name.Status = ApprovalStatus.Pending;
                initiative.Name.Comment = null;
                _context.InitiativeItems.Update(initiative.Name);
            }
            _context.PlanInitiatives.Update(initiative);
            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Initiative.Delete")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var initiative = await _context.PlanInitiatives
                .Include(i => i.InitiativeItems)
                .Include(i => i.InitiativeKpis)
                .FirstOrDefaultAsync(i => i.Id == id);
            if (initiative == null) return NotFound("Initiative not found");
            _context.PlanInitiatives.Remove(initiative);
            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Initiative.GetOne")]
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var initiative = await _context.PlanInitiatives
                .Include(i => i.InitiativeItems)
                .Include(i => i.Goal)
                .ThenInclude(i => i.Name)
                .Include(i => i.Goal)
                .ThenInclude(i => i.Descripition)
                .Include(i => i.Goal)
                .ThenInclude(i => i.Indicator)

                .Include(i => i.InitiativeKpis)
                .Include(i=>i.Name)
                
                .FirstOrDefaultAsync(i => i.Id == id);
            if (initiative == null) return NotFound("Initiative not found");
            var result = new GetInitiativesDto
            {
                Id = initiative.Id,
                 InitiativeWeight=initiative.InitiativeWeight,
                Goal = new GetGoalsForInitiativeDto
                {
                    Id = initiative.Goal.Id,
                    Name = initiative.Goal.Name.Value,
                    Descripition = initiative.Goal.Descripition.Value,
                    Indicator = initiative.Goal.Indicator.Value,

                },

                Status = initiative.Status.ToString(),
                Comment = initiative.Comment,
                name=new InitiativesItemDto
                {
                    Id = initiative.Name.Id,
                    Value = initiative.Name.Value,
                    Status= ((ApprovalStatus)initiative.Name.Status).ToString(),
                    Comment= initiative.Name.Comment,

                },
                InitiativeItem = initiative.InitiativeItems.Where(func.GetFilterInitiativeItem(Enum.Parse<RoleEnum>(user!.Role!))).OrderBy(x => x.Id).Select(x => new InitiativesItemDto
                {
                    Id = x.Id,
                    Value = x.Value,
                    Type = (InitiativeItemType)x.Type,
                    Status= ((ApprovalStatus)x.Status).ToString(),
                    Comment= x.Comment,
                }).ToList(),
                InitiativeKPIs = initiative.InitiativeKpis.Where(func.GetFilterInitiativeKpis((Enum.Parse<RoleEnum>(user!.Role!)))).OrderBy(x => x.Id).Select(x => new InitiativeKpiDto
                {
                    Id = x.Id,
                    Value = x.Value,
                    Status = ((ApprovalStatus)x.Status).ToString(),
                    Comment= x.Comment,
                }).ToList()
                
            };
            return Ok(result);
        }
        [Authorize(Policy = "Initiative.GetAll")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
          [FromQuery] int PlanId,
          [FromQuery] int Page = 1,
          [FromQuery] int PerPage = 5
        )
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goals = await _context.PlanInitiatives.Where(i => i.PlanId == PlanId).Include(i => i.InitiativeKpis).Include(i=>i.Name).Include(i => i.Unit).Include(i => i.User).Include(i => i.InitiativeItems).Include(i=>i.Goal).ThenInclude(i=>i.Name).ToListAsync();
            goals = goals.Where(func.GetFilterInitiative(Enum.Parse<RoleEnum>(user!.Role!))).ToList();

            var totalCount = goals.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / PerPage);

            // Ensure the page is at least 1  
            Page = Page < 1 ? 1 : Page;

            var paginatedBlogs = goals
                .Skip((Page - 1) * PerPage)
                .Take(PerPage)
                .ToList();

            var AllGoalsAfterMapping = goals.Select(i => new GetAllInitiativesDto
            {
                Id = i.Id,
                Status = i.Status.ToString(),
                Comment = i.Comment,
                EmployeeName = i.User!.DisplayName,
                GoalName = i.Goal.Name.Value,
                Date = i.CreatedAt.HasValue ? i.CreatedAt.Value.ToString("yyyy-MM-dd") : string.Empty,
                UnitName = i.Unit.Name,
                InitiativeWeight = i.InitiativeWeight,
                name=i.Name.Value,
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
        [Authorize(Policy = "Initiative.Approve")]
        [HttpPost("ApproveInitiative/{id}")]
        public async Task<IActionResult> ApproveInitiaitev(int id)
        {
            var initiative = await _context.PlanInitiatives.FindAsync(id);
             if (initiative.Status == ApprovalStatus.ReturnedByUnitManager || initiative.Status == ApprovalStatus.ReturnedByHighManagement || initiative.Status == ApprovalStatus.ReturnedByRegionManager
                || initiative.Status == ApprovalStatus.RejectedByUnitManager || initiative.Status == ApprovalStatus.RejectedByHighManagement || initiative.Status == ApprovalStatus.RejectedByRegionManager)
            {
                initiative.Status = ApprovalStatus.Pending;
                initiative.Comment = null;
            }
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiative == null) return NotFound("Initiative not found");
            initiative.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _context.PlanInitiatives.Update(initiative);
            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });

        }
        [Authorize(Policy = "Initiative.Approve")]
        [HttpPost("ApproveItem/{id}")]
        public async Task<IActionResult> ApproveItem(int id)
        {
            var initiativeItem = await _context.InitiativeItems.FindAsync(id);
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiativeItem == null) return NotFound("Initiative Item not found");
            initiativeItem.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _context.InitiativeItems.Update(initiativeItem);
            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Initiative.Reject")]
        [HttpPost("RejectItem/{InitiativeId}/{InitiativeItemId}")]
        public async Task<IActionResult> RejectItem(int InitiativeId,int InitiativeItemId, Comment comment)
        {
            var initiativeItem = await _context.InitiativeItems.FindAsync(InitiativeItemId);
            var initiative = await _context.PlanInitiatives.FindAsync(InitiativeId);
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiativeItem == null) return NotFound("Initiative Item not found");
            initiativeItem.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Comment = comment.Comments;
            _context.PlanInitiatives.Update(initiative);
            initiativeItem.Comment = comment.Comments;
            _context.InitiativeItems.Update(initiativeItem);
            await _context.SaveChangesAsync();
            var plan = await _context.Plans.Where(i => i.Id == initiative.PlanId).FirstOrDefaultAsync();
            // Notify the PLAN's unit (employee + unit manager), not the approver's unit.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Reject, ModulesNamesOnArabic.Init, unit, FormNameToReturnToFront.init, plan.Id, actingRole);
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Initiative.Return")]
        [HttpPost("ReturnItem/{InitiativeId}/{InitiativeItemId}")]
        public async Task<IActionResult> ReturnItem(int InitiativeId, int InitiativeItemId, Comment comment)
        {
            var initiativeItem = await _context.InitiativeItems.FindAsync(InitiativeItemId);
            var initiative = await _context.PlanInitiatives.FindAsync(InitiativeId);
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiativeItem == null) return NotFound("Initiative Item not found");
            initiativeItem.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Comment = comment.Comments;
            _context.PlanInitiatives.Update(initiative);
            initiativeItem.Comment = comment.Comments;
            _context.InitiativeItems.Update(initiativeItem);
            await _context.SaveChangesAsync();
            var plan = await _context.Plans.Where(i => i.Id == initiative.PlanId).FirstOrDefaultAsync();
            // Notify the PLAN's unit (employee + unit manager), not the approver's unit.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Return, ModulesNamesOnArabic.Init, unit, FormNameToReturnToFront.init, plan.Id, actingRole);
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Initiative.Approve")]
        [HttpPost("ApproveKpis/{id}")]
        public async Task<IActionResult> ApproveKpis(int id)
        {
            var initiativeItem = await _context.InitiativeKpis.FindAsync(id);
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiativeItem == null) return NotFound("Initiative Item not found");
            initiativeItem.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _context.InitiativeKpis.Update(initiativeItem);
            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Initiative.Reject")]
        [HttpPost("RejectKpis/{InitiativeId}/{InitiativeKpisId}")]
        public async Task<IActionResult> RejectKpis(int InitiativeId, int InitiativeKpisId, Comment comment)
        {
            var initiativeItem = await _context.InitiativeKpis.FindAsync(InitiativeKpisId);
            var initiative = await _context.PlanInitiatives.FindAsync(InitiativeId);
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiativeItem == null) return NotFound("Initiative Item not found");
            initiativeItem.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Comment = comment.Comments;
            _context.PlanInitiatives.Update(initiative);
            initiativeItem.Comment = comment.Comments;
            _context.InitiativeKpis.Update(initiativeItem);
            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });
        }
        [Authorize(Policy = "Initiative.Return")]
        [HttpPost("ReturnKpis/{InitiativeId}/{InitiativeKpisId}")]
        public async Task<IActionResult> ReturnKpis(int InitiativeId, int InitiativeKpisId, Comment comment)
        {
            var initiativeItem = await _context.InitiativeKpis.FindAsync(InitiativeKpisId);
            var initiative = await _context.PlanInitiatives.FindAsync(InitiativeId);
            var user = await _currentUser.GetCurrentUserAsync();
            if (initiativeItem == null) return NotFound("Initiative Item not found");
            initiativeItem.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            initiative.Comment = comment.Comments;
            _context.PlanInitiatives.Update(initiative);
            initiativeItem.Comment = comment.Comments;
            _context.InitiativeKpis.Update(initiativeItem);
            await _context.SaveChangesAsync();
            return Ok(new { message = "ok" });
        }


        [Authorize(Policy = "Initiative.GetOne")]
        [HttpGet("InitiativeStageStatus/{id}")]
        public async Task<IActionResult> GetInitiativeStageStatus(int id)
        {
            var i=await _context.Plans.Where(i => i.Id == id).Include(i => i.PlanInitiativeStep).FirstOrDefaultAsync(i=>i.Id==id);
            if (i == null) return NotFound("Initiative Stage not found");
            return Ok(new
            {
                i.PlanInitiativeStep.Id,
              status=  ((ApprovalStatus)i.PlanInitiativeStep.Status).ToString(),

            });
        }
        [Authorize(Policy = "Initiative.Approve")]
        [HttpPost("ApproveInitiativeStage/{id}")]
        public async Task<IActionResult> ApproveInitiativeStage(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var plan = await _context.Plans.Where(i => i.Id == id).Include(i => i.PlanInitiativeStep).ThenInclude(i => i.Initiative).ThenInclude(i=>i.InitiativeItems)
                .Include(i=>i.PlanInitiativeStep).ThenInclude(i=>i.Initiative).ThenInclude(i=>i.InitiativeKpis)
                .Include(i=>i.PlanInitiativeStep).ThenInclude(i=>i.Initiative).ThenInclude(i=>i.Name).FirstOrDefaultAsync(i => i.Id == id);
            // Notify the PLAN's unit (employee + unit manager), not the approver's
            // unit — otherwise region/high management approvals never reach the
            // plan's employees.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);
            var initiativeStatuses = new List<ApprovalStatus?>();
            foreach (var it in plan.PlanInitiativeStep.Initiative)
            {
                initiativeStatuses.Add(it.Status);
                initiativeStatuses.Add(it.Name.Status);
                initiativeStatuses.AddRange(it.InitiativeItems.Select(x => (ApprovalStatus?)x.Status));
                initiativeStatuses.AddRange(it.InitiativeKpis.Select(x => (ApprovalStatus?)x.Status));
            }
            if (initiativeStatuses.Any(s => Utils.IsRejectedOrReturned(s)))
            {
                return BadRequest(new { message = "لا يمكن اعتماد المرحلة لوجود عناصر مرفوضة أو مُرجعة أو لم يتم اتخاذ إجراء عليها بعد" });
            }
            foreach (var item in plan.PlanInitiativeStep.Initiative)
            {
                if (user.Role == RoleEnum.UnitManager.ToString())
                {
                    if (item.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.PlanInitiatives.Update(item);
                    }
                    foreach (var items in item.InitiativeItems)
                    {
                        if (items.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                        {
                            items.Status = ApprovalStatus.ApprovedByUnitManager;
                            _context.InitiativeItems.Update(items);
                        }
                    }
                    foreach (var items in item.InitiativeKpis)
                    {
                        if (items.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                        {
                            items.Status = ApprovalStatus.ApprovedByUnitManager;
                            _context.InitiativeKpis.Update(items);
                        }
                    }
                    if(item.Name.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Name.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.InitiativeItems.Update(item.Name);
                    }
                }
                if (user.Role == RoleEnum.RegionManager.ToString())
                {
                    if (item.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.PlanInitiatives.Update(item);
                    }
                    foreach (var items in item.InitiativeItems)
                    {
                        if (items.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                        {
                            items.Status = ApprovalStatus.ApprovedByRegionManager;
                            _context.InitiativeItems.Update(items);
                        }
                    }
                    foreach (var items in item.InitiativeKpis)
                    {
                        if (items.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                        {
                            items.Status = ApprovalStatus.ApprovedByRegionManager;
                            _context.InitiativeKpis.Update(items);
                        }
                    }
                    if (item.Name.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Name.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.InitiativeItems.Update(item.Name);
                    }
                }
                if (user.Role == RoleEnum.HighManagement.ToString())
                {
                    if (item.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.PlanInitiatives.Update(item);
                    }
                    foreach (var items in item.InitiativeItems)
                    {
                        if (items.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                        {
                            items.Status = ApprovalStatus.ApprovedByHighManagement;
                            _context.InitiativeItems.Update(items);
                        }
                    }
                    foreach (var items in item.InitiativeKpis)
                    {
                        if (items.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                        {
                            items.Status = ApprovalStatus.ApprovedByHighManagement;
                            _context.InitiativeKpis.Update(items);
                        }
                    }
                    if (item.Name.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Name.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.InitiativeItems.Update(item.Name);

                    }
                }

            }
            if (user.Role == RoleEnum.HighManagement.ToString())
            {
                plan.CurrentStage = StrategicPlanLevels.ProjectsStage;
                _context.Plans.Update(plan);
            }
            plan.PlanInitiativeStep.Status = Utils.GetApprovalStatusV2(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _context.PlanInitiativeStep.Update(plan.PlanInitiativeStep);
            await _context.SaveChangesAsync();
            var notifAction = actingRole == RoleEnum.HighManagement ? NotificationAction.FinalApprove : NotificationAction.Approve;
            await _notification.NotifyAsync(notifAction, ModulesNamesOnArabic.Init, unit, FormNameToReturnToFront.init, plan.Id, actingRole);
            return Ok(new { message = "ok" });


        }
        [Authorize(Policy = "Initiative.GetAll")]
        [HttpGet("GetAcceptableGoals/{id}")]
        public async Task<IActionResult> GetAcceptableGoals(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goals = await _context.PlanGoals.Where(i => i.PlanId == id&&i.Status==ApprovalStatus.ApprovedByHighManagement).Include(i => i.Name).Include(i => i.Descripition).Include(i => i.Indicator).ToListAsync();
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
    }
}
