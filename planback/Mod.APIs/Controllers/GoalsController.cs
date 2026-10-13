using AutoMapper;
using Azure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Mod.Core.DTOs.APIsResponse;
using Mod.Core.Entities;
using Mod.Core.Utils;
using QuestPDF.Infrastructure;
using System.Linq;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GoalsController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUser;
        private readonly INotificationService _notification;

        public GoalsController(ModContext context, IMapper mapper, ICurrentUserService currentUser,INotificationService notificationService)
        {
            _context = context;
            _mapper = mapper;
            _currentUser = currentUser;
            _notification = notificationService;
        }
        [Authorize(Policy = "Goals.Update")]
        [HttpPost("Convert/{PlanId}")]
        public async Task<IActionResult> Convert(int PlanId)
        {
            var goals = await _context.PlanGoals.Where(i => i.PlanId == PlanId).ToListAsync();
            var currentUser = await _currentUser.GetCurrentUserAsync();
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == currentUser.UnitId);
            var submittedAny = false;
            foreach (var goal in goals)
            {
                if (goal.Status == ApprovalStatus.SavedAsDraft)
                {
                    goal.Status = ApprovalStatus.Pending;
                    _context.PlanGoals.Update(goal);
                    submittedAny = true;
                }
            }

            // New goals start with the unit manager, so the stage has to as well.
            // Left where it was — with the region manager, say — the new goal sat
            // below a stage that had already gone past the one role able to
            // review it. Same rule as the direction stage's Convert.
            if (submittedAny)
            {
                var plan = await _context.Plans.FirstOrDefaultAsync(p => p.Id == PlanId);
                if (plan?.PlanGoalsStepId != null)
                {
                    ReopenStage(await _context.PlanGoalsStep.FirstOrDefaultAsync(s => s.Id == plan.PlanGoalsStepId));
                }
            }
            await _context.SaveChangesAsync();
            await _notification.NotifyAsync(NotificationAction.Submit, ModulesNamesOnArabic.Objectives, unit, FormNameToReturnToFront.Goals, PlanId, RoleEnum.UnitEmployee);
            return Ok(new { PlanID = PlanId });
        }
        [Authorize(Policy = "Goals.Add")]
        [HttpPost("{PlanId}")]
        public async Task<APIsGenralResponseDto<AddGoalDto>> Add(AddGoalDto obj, int PlanId)
        {
            var plan = await _context.Plans.Where(i=>i.Id==PlanId).Include(i=>i.PlanGoalsStep).FirstOrDefaultAsync(i=>i.Id==PlanId);
            List<AnalysisPoints> point = new List<AnalysisPoints>();
            var user = await _currentUser.GetCurrentUserAsync();
            foreach (var points in obj.AnalysisPoints)
            {
                point.Add(await _context.AnalysisPoints.Where(i => i.Id == points).FirstOrDefaultAsync(i => i.Id == points));
            }
            var PlanGoals = new PlanGoals
            {
                PlanId = PlanId,
                Plan = plan,
                Units = plan.Units,
                UnitId = plan.UnitId,
                Name = new GoalItems { Value = obj.Name, Status = ApprovalStatus.Pending },
                Indicator = new GoalItems { Value = obj.Indicator, Status = ApprovalStatus.Pending },
                Descripition = new GoalItems { Value = obj.Description, Status = ApprovalStatus.Pending },
                AnalysisPoints = point,
                Status = ApprovalStatus.Pending,
                planGoalsStep = plan.PlanGoalsStep,
                planGoalsStepId = plan.PlanGoalsStepId,
                AppUserId = user.Id,
                User = user,



            };
            PlanGoals.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));

            _context.PlanGoals.Add(PlanGoals);
           await _context.SaveChangesAsync();
            return new APIsGenralResponseDto<AddGoalDto>("Succses", obj);

        }
        [Authorize(Policy = "Goals.GetOne")]
        [HttpGet("{GoalId}")]
        public async Task<APIsGenralResponseDto<GetGoalsDto>> GetById(int GoalId)
        {

            var goal = await _context.PlanGoals.Where(i=>i.Id==GoalId).Include(i=>i.AnalysisPoints).Include(i=>i.Units).Include(i=>i.User).Include(i=>i.Indicator).Include(i=>i.Descripition).Include(i=>i.Indicator).Include(i=>i.Name).FirstOrDefaultAsync(i=>i.Id==GoalId);
            if (goal == null) return new APIsGenralResponseDto<GetGoalsDto>(Message: "Not found", null);

          

            IEnumerable<AnalysisPoints> Points = goal.AnalysisPoints.Where(i => i.Type == AnalysisPointsType.Strength);

            var GoalAfterMapping = _mapper.Map<GetGoalsDto>(goal);
            GoalAfterMapping.Descripition = _mapper.Map<GoalItemDto>(goal.Descripition);
            GoalAfterMapping.Indicator = _mapper.Map<GoalItemDto>(goal.Indicator);
            GoalAfterMapping.Name = _mapper.Map<GoalItemDto>(goal.Name);
            GoalAfterMapping.UnitName = goal.Units.Name;
            GoalAfterMapping.EmployeeName = goal.User.DisplayName;

            GoalAfterMapping.Strength = _mapper.Map<IEnumerable<AnalysisPoints>, ICollection<GetAcceptableAnalysisPointDto>>(Points);
            Points = goal.AnalysisPoints.Where(i => i.Type == AnalysisPointsType.Threat);
            GoalAfterMapping.Threat = _mapper.Map<IEnumerable<AnalysisPoints>, ICollection<GetAcceptableAnalysisPointDto>>(Points);
            Points = goal.AnalysisPoints.Where(i => i.Type == AnalysisPointsType.Risk);
            GoalAfterMapping.Risk = _mapper.Map<IEnumerable<AnalysisPoints>, ICollection<GetAcceptableAnalysisPointDto>>(Points);
            Points = goal.AnalysisPoints.Where(i => i.Type == AnalysisPointsType.Opportunity);
            GoalAfterMapping.Opportunity = _mapper.Map<IEnumerable<AnalysisPoints>, ICollection<GetAcceptableAnalysisPointDto>>(Points);

           

            return new APIsGenralResponseDto<GetGoalsDto>("Sucsses", GoalAfterMapping);
        }
        [Authorize(Policy = "Goals.Update")]
        [HttpPost]
        public async Task<APIsGenralResponseDto<AddGoalDto>> Update(AddGoalDto obj)
        {
            var PlanGoal = await _context.PlanGoals.Where(i=>i.Id==obj.Id).Include(i=>i.AnalysisPoints).Include(i=>i.Descripition).Include(i=>i.Indicator).Include(i=>i.Name).Include(i=>i.planGoalsStep).FirstOrDefaultAsync(i=>i.Id==obj.Id);
            List<AnalysisPoints> point = new List<AnalysisPoints>();
            var planstep = await _context.PlanGoalsStep.Where(i => i.Id == PlanGoal.planGoalsStepId).Include(i => i.Goals).ThenInclude(i => i.Name).Include(i => i.Goals).ThenInclude(i => i.Descripition).Include(i => i.Goals).ThenInclude(i => i.Indicator).FirstOrDefaultAsync(i => i.Id == PlanGoal.planGoalsStepId);
            if(PlanGoal.Status==ApprovalStatus.ReturnedByUnitManager|| PlanGoal.Status==ApprovalStatus.ReturnedByHighManagement|| PlanGoal.Status==ApprovalStatus.ReturnedByRegionManager
                || PlanGoal.Status==ApprovalStatus.RejectedByUnitManager|| PlanGoal.Status==ApprovalStatus.RejectedByHighManagement|| PlanGoal.Status==ApprovalStatus.RejectedByRegionManager)
            {
                PlanGoal.Status = ApprovalStatus.Pending;
                PlanGoal.Comment = null;

                planstep.Status = ApprovalStatus.Pending;
                _context.PlanGoalsStep.Update(planstep);
            }
            if(PlanGoal.Descripition.Status==ApprovalStatus.ReturnedByHighManagement|| PlanGoal.Descripition.Status == ApprovalStatus.ReturnedByRegionManager|| PlanGoal.Descripition.Status == ApprovalStatus.ReturnedByUnitManager
                || PlanGoal.Descripition.Status==ApprovalStatus.RejectedByHighManagement|| PlanGoal.Descripition.Status == ApprovalStatus.RejectedByRegionManager|| PlanGoal.Descripition.Status == ApprovalStatus.RejectedByUnitManager)
            {
                PlanGoal.Descripition.Status = ApprovalStatus.Pending;
                _context.GoalItems.Update(PlanGoal.Descripition);
            }
            if (PlanGoal.Indicator.Status == ApprovalStatus.ReturnedByHighManagement || PlanGoal.Indicator.Status == ApprovalStatus.ReturnedByRegionManager || PlanGoal.Indicator.Status == ApprovalStatus.ReturnedByUnitManager
                || PlanGoal.Indicator.Status == ApprovalStatus.RejectedByHighManagement || PlanGoal.Indicator.Status == ApprovalStatus.RejectedByRegionManager || PlanGoal.Indicator.Status == ApprovalStatus.RejectedByUnitManager)
            {
                PlanGoal.Indicator.Status = ApprovalStatus.Pending;
                _context.GoalItems.Update(PlanGoal.Indicator);
            }
            if (PlanGoal.Name.Status == ApprovalStatus.ReturnedByHighManagement || PlanGoal.Name.Status == ApprovalStatus.ReturnedByRegionManager || PlanGoal.Name.Status == ApprovalStatus.ReturnedByUnitManager
                || PlanGoal.Name.Status == ApprovalStatus.RejectedByHighManagement || PlanGoal.Name.Status == ApprovalStatus.RejectedByRegionManager || PlanGoal.Name.Status == ApprovalStatus.RejectedByUnitManager)
            {
                PlanGoal.Name.Status = ApprovalStatus.Pending;
                _context.GoalItems.Update(PlanGoal.Name);
            }

            foreach (var points in obj.AnalysisPoints)
            {
                point.Add(await _context.AnalysisPoints.Where(i => i.Id == points).FirstOrDefaultAsync(i => i.Id == points));
            }
            PlanGoal.AnalysisPoints = point;
            PlanGoal.Name.Value = obj.Name;
            PlanGoal.Descripition.Value = obj.Description;
            PlanGoal.Indicator.Value = obj.Indicator;

           _context.PlanGoals.Update(PlanGoal);
            // Must be awaited: the DbContext is scoped to the request and is disposed
            // when the action returns, so a fire-and-forget save races with disposal
            // and the edit can be silently lost. This is the path an employee uses to
            // fix a returned goal, so a lost save left the stage blocked for good.
            await _context.SaveChangesAsync();

            return new APIsGenralResponseDto<AddGoalDto>("Sucsses", obj);

        }
        [Authorize(Policy = "Goals.GetAll")]
        [HttpGet]
        public async Task<IActionResult> GetAll(
           [FromQuery] int PlanId,
           [FromQuery] int Page = 1,
           [FromQuery] int PerPage = 5
        )
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goals = await _context.PlanGoals.Where(i => i.PlanId == PlanId).Include(i => i.AnalysisPoints).Include(i=>i.Units).Include(i=>i.User).Include(i=>i.Name).Include(i=>i.Indicator).Include(i=>i.Descripition).ToListAsync();
            goals = goals.Where(i => func.GetFilterGoal(Enum.Parse<RoleEnum>(user!.Role!))(i) && i.PlanId == PlanId).ToList();

            var totalCount = goals.Count;
            var totalPages = (int)Math.Ceiling((double)totalCount / PerPage);


            
            // Ensure the page is at least 1  
            Page = Page < 1 ? 1 : Page;

            var paginatedBlogs = goals
                .Skip((Page - 1) * PerPage)
                .Take(PerPage)
                .ToList();

            var AllGoalsAfterMapping = _mapper.Map<IEnumerable<PlanGoals>, IEnumerable<GetGoalsDto>>(paginatedBlogs);
            var metadata = new MetaDataDto
            {
                CurrentPage = Page,
                PerPage = PerPage,
                Total = totalCount,
                From = ((Page - 1) * PerPage) + 1,
                To = Math.Min(Page * PerPage, totalCount),
                LastPage = totalPages
            };

            return Ok(new APIsResponseFilterDto<GetGoalsDto>
            {
                Data = (List<GetGoalsDto>)AllGoalsAfterMapping,
                Metadata = metadata,
                Status = "Success"
            });
        }
        [Authorize(Policy = "Goals.Delete")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var goal = await _context.PlanGoals.FindAsync(id);
            if (goal == null) return NotFound(new APIsGenralResponseDto<AddGoalDto>("Not Found", null));
            // Enforced server-side as well as in the UI, so it cannot be bypassed by
            // calling the API directly.
            if (!Utils.IsDeletable(goal.Status))
            {
                return BadRequest(new APIsGenralResponseDto<AddGoalDto>("لا يمكن حذف هدف تمت الموافقة عليه", null));
            }
            _context.PlanGoals.Remove(goal);
            await _context.SaveChangesAsync();
            return Ok(new APIsGenralResponseDto<AddGoalDto>("Deleted Successfully", null));
        }
        // Put the stage back with the unit manager because something in it has to
        // be reviewed from the bottom again. A finally approved stage is left
        // alone, since the plan has already moved on to the initiatives.
        private void ReopenStage(PlanGoalsStep? step)
        {
            if (step == null) return;
            if (step.Status == ApprovalStatus.Pending || step.Status == ApprovalStatus.ApprovedByHighManagement) return;

            step.Status = ApprovalStatus.Pending;
            _context.PlanGoalsStep.Update(step);
        }

        // The goals stage status of a plan, read the same way GetGoalStageStatus
        // hands it to the frontend, so both sides judge the ladder from one value.
        private async Task<ApprovalStatus?> GetStageStatusForPlan(int planId)
        {
            var stepId = await _context.Plans.Where(p => p.Id == planId).Select(p => p.PlanGoalsStepId).FirstOrDefaultAsync();
            if (stepId == null) return null;

            return await _context.PlanGoalsStep.Where(s => s.Id == stepId).Select(s => (ApprovalStatus?)s.Status).FirstOrDefaultAsync();
        }

        // Addresses a notification to the PLAN's unit, so an action taken by
        // region or high management still reaches the employees who own the work.
        private async Task NotifyOnGoals(int? planId, NotificationAction action, AppUser user, RoleEnum actingRole)
        {
            if (planId == null) return;

            var plan = await _context.Plans.FirstOrDefaultAsync(i => i.Id == planId);
            if (plan == null) return;

            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);

            await _notification.NotifyAsync(action, ModulesNamesOnArabic.Objectives, unit, FormNameToReturnToFront.Goals, plan.Id, actingRole);
        }

        [Authorize(Policy = "Goals.Approve")]
        [HttpPost("ApproveGoal/{id}")]
        public async Task<IActionResult> ApproveGoal(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goal = await _context.PlanGoals.Where(g => g.Id == id).Include(g => g.Name).Include(g => g.Descripition).Include(g => g.Indicator).FirstOrDefaultAsync();
            if (goal == null) return NotFound(new APIsGenralResponseDto<AddGoalDto>("Not Found", null));
            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);

            // Respect the ladder, and only approve a goal once each of its items
            // has been approved at this level or above. An item approved higher up
            // before the goal was reworked keeps that approval and counts as done.
            var stageStatus = await GetStageStatusForPlan(goal.PlanId);
            if (!Utils.CanRoleActInStage(goal.Status, stageStatus, actingRole))
            {
                return BadRequest(new { message = "لا يمكنك اتخاذ إجراء على هذا الهدف في حالته الحالية" });
            }
            var itemStatuses = new[] { goal.Name?.Status, goal.Descripition?.Status, goal.Indicator?.Status };
            if (itemStatuses.Any(s => Utils.ApprovalRank(s) < Utils.RoleRank(actingRole)))
            {
                return BadRequest(new { message = "يجب اتخاذ إجراء على جميع عناصر الهدف (الاسم، الوصف، المؤشر) قبل الموافقة على الهدف" });
            }

            goal.Status = Utils.GetApprovalStatus(ActionEnum.Approve, actingRole);
            _context.PlanGoals.Update(goal);
            await _context.SaveChangesAsync();

            // Approving used to notify nobody, so an employee heard back only
            // when their work was refused, never when it was accepted.
            await NotifyOnGoals(goal.PlanId, NotificationAction.Approve, user, actingRole);
            return Ok(new APIsGenralResponseDto<AddGoalDto>("Approved Successfully", null));
        }
        [Authorize(Policy = "Goals.Approve")]
        [HttpPost("ApproveGoalItem/{id}")]
        public async Task<IActionResult> ApproveGoalItem(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goal = await _context.GoalItems.FindAsync(id);

            if (goal == null) return NotFound(new APIsGenralResponseDto<AddGoalDto>("Not Found", null));
            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);

            // A GoalItem is reached from its parent goal, which holds the keys.
            var ownerPlanId = await _context.PlanGoals
                .Where(g => g.NameId == goal.Id || g.DescripitionId == goal.Id || g.IndicatorId == goal.Id)
                .Select(g => (int?)g.PlanId)
                .FirstOrDefaultAsync();

            var stageStatus = ownerPlanId == null ? null : await GetStageStatusForPlan(ownerPlanId.Value);
            if (!Utils.CanRoleActInStage(goal.Status, stageStatus, actingRole))
            {
                return BadRequest(new { message = "لا يمكنك اتخاذ إجراء على هذا العنصر في حالته الحالية" });
            }

            goal.Status = Utils.GetApprovalStatus(ActionEnum.Approve, actingRole);
            _context.GoalItems.Update(goal);
            await _context.SaveChangesAsync();

            await NotifyOnGoals(ownerPlanId, NotificationAction.Approve, user, actingRole);
            return Ok(new APIsGenralResponseDto<AddGoalDto>("Approved Successfully", null));
        }
        [Authorize(Policy = "Goals.Reject")]
        [HttpPost("RejectGoalItem/{GoalId}/{GoalItemId}")]
        public async Task<IActionResult> RejectGoalItem(int GoalId,int GoalItemId,[FromBody]Comment comment)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goalItem = await _context.GoalItems.FindAsync(GoalItemId);
            var goal = await _context.PlanGoals.FindAsync(GoalId);
            if (goal == null) return NotFound(new APIsGenralResponseDto<AddGoalDto>("Not Found", null));
            if (goalItem != null && !Utils.CanRoleActInStage(goalItem.Status, await GetStageStatusForPlan(goal.PlanId), Enum.Parse<RoleEnum>(user!.Role!)))
            {
                return BadRequest(new { message = "لا يمكنك اتخاذ إجراء على هذا العنصر في حالته الحالية" });
            }
            goal.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            goal.Comment = comment.Comments;
            if (goalItem == null) return NotFound(new APIsGenralResponseDto<AddGoalDto>("Not Found", null));
            goalItem.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            goalItem.Comment = comment.Comments;
            _context.GoalItems.Update(goalItem);
            _context.PlanGoals.Update(goal);
            await _context.SaveChangesAsync();
            var plan = await _context.Plans.Where(i => i.Id == goal.PlanId).Include(i => i.PlanGoalsStep).FirstOrDefaultAsync(i => i.Id == goal.PlanId);
            // Notify the PLAN's unit (employee + unit manager), not the approver's unit.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.Where(i => i.Id == user.UnitId).FirstOrDefaultAsync();
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Reject, ModulesNamesOnArabic.Objectives, unit, FormNameToReturnToFront.Goals, plan.Id, actingRole);
            return Ok(new APIsGenralResponseDto<AddGoalDto>("Rejected Successfully", null));
        }
        [Authorize(Policy = "Goals.Return")]
        [HttpPost("ReturnGoalItem/{GoalId}/{GoalItemId}")]
        public async Task<IActionResult> ReturnGoalItem(int GoalId, int GoalItemId, [FromBody] Comment comment)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var goalItem = await _context.GoalItems.FindAsync(GoalItemId);
            var goal = await _context.PlanGoals.Where(i=>i.Id==GoalId).Include(i=>i.planGoalsStep).FirstOrDefaultAsync(i=>i.Id==GoalId);
            if (goal == null) return NotFound(new APIsGenralResponseDto<AddGoalDto>("Not Found", null));
            if (goalItem != null && !Utils.CanRoleActInStage(goalItem.Status, await GetStageStatusForPlan(goal.PlanId), Enum.Parse<RoleEnum>(user!.Role!)))
            {
                return BadRequest(new { message = "لا يمكنك اتخاذ إجراء على هذا العنصر في حالته الحالية" });
            }
            goal.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            goal.Comment = comment.Comments;

            if (goalItem == null) return NotFound(new APIsGenralResponseDto<AddGoalDto>("Not Found", null));
            goalItem.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            goalItem.Comment = comment.Comments;


            _context.GoalItems.Update(goalItem);
            _context.PlanGoals.Update(goal);
            await _context.SaveChangesAsync();
            var plan = await _context.Plans.Where(i => i.Id == goal.PlanId).FirstOrDefaultAsync();
            // Notify the PLAN's unit (employee + unit manager), not the approver's unit.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.FirstOrDefaultAsync(i => i.Id == user.UnitId);
            var actingRole = Enum.Parse<RoleEnum>(user.Role);
            await _notification.NotifyAsync(NotificationAction.Return, ModulesNamesOnArabic.Objectives, unit, FormNameToReturnToFront.Goals, plan.Id, actingRole);
            return Ok(new APIsGenralResponseDto<AddGoalDto>("Returned Successfully", null));
        }
        [Authorize(Policy = "Goals.GetOne")]
        [HttpGet("GetGoalStageStatus/{PlanId}")]
        public async Task<IActionResult> GetGoalStageStatus(int PlanId)
        {
            var goal=await _context.Plans.Where(i => i.Id == PlanId).Include(i => i.PlanGoalsStep).FirstOrDefaultAsync(i => i.Id == PlanId);
            var g=await _context.PlanGoalsStep.Where(i => i.Id == goal.PlanGoalsStepId).FirstOrDefaultAsync(i=>i.Id==goal.PlanGoalsStepId);

            return Ok(new {id=g.Id,status= ((ApprovalStatus)g.Status).ToString() });
        }
        [Authorize(Policy = "Goals.Approve")]
        [HttpPost("ApproveStage/{id}")]
        public async Task<IActionResult>ApproveStage(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var plan = await _context.Plans.Where(i => i.Id == id).Include(i => i.PlanGoalsStep).ThenInclude(i => i.Goals).ThenInclude(i=>i.Name).Include(i=>i.PlanGoalsStep)
                .ThenInclude(i=>i.Goals).ThenInclude(i=>i.Descripition).Include(i=>i.PlanGoalsStep).ThenInclude(i=>i.Goals).ThenInclude(i=>i.Indicator).FirstOrDefaultAsync(i => i.Id == id);
            // Notify the PLAN's unit (employee + unit manager), not the approver's
            // unit — otherwise region/high management approvals never reach the
            // plan's employees.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == plan.UnitId)
                       ?? await _context.Units.Where(i => i.Id == user.UnitId).FirstOrDefaultAsync();
            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);
            if (Utils.RoleRank(actingRole) == 0)
            {
                return BadRequest(new { message = "لا تملك صلاحية اعتماد المرحلة" });
            }

            var goalStatuses = new List<ApprovalStatus?>();
            // A goal the employee has not submitted yet is not part of this round.
            // Its items are created Pending, so counting them would block every
            // manager's send while the managers cannot even see the draft.
            foreach (var g in plan.PlanGoalsStep.Goals.Where(g => g.Status != ApprovalStatus.SavedAsDraft))
            {
                goalStatuses.Add(g.Status);
                goalStatuses.Add(g.Name?.Status);
                goalStatuses.Add(g.Indicator?.Status);
                goalStatuses.Add(g.Descripition?.Status);
            }
            if (goalStatuses.Count == 0)
            {
                return BadRequest(new { message = "لا توجد أهداف مرسلة لاعتمادها" });
            }
            if (goalStatuses.Any(s => Utils.IsRejectedOrReturned(s)))
            {
                return BadRequest(new { message = "لا يمكن اعتماد المرحلة لوجود عناصر مرفوضة أو مُرجعة أو لم يتم اتخاذ إجراء عليها بعد" });
            }

            // Every goal and item has to be approved at this level or above before
            // the stage moves on — the same send rule as the direction stage.
            // Items approved further up before a rework keep that approval.
            var notYetHandled = goalStatuses.Count(s => Utils.BlocksStageApproval(s, actingRole));
            if (notYetHandled > 0)
            {
                return BadRequest(new
                {
                    message = $"يوجد {notYetHandled} عنصر لم يتم اتخاذ إجراء عليه بعد، يرجى مراجعة جميع الأهداف وعناصرها قبل الإرسال"
                });
            }

            // A second press on a stage already sent would rewrite its status and
            // pull it back down a level.
            if (!Utils.HasSomethingToSend(plan.PlanGoalsStep.Status, goalStatuses, actingRole))
            {
                return BadRequest(new { message = "تم إرسال المرحلة مسبقاً ولا توجد أهداف جديدة بانتظار الإرسال" });
            }
            foreach (var item in plan.PlanGoalsStep.Goals)
            {
                if(user.Role==RoleEnum.UnitManager.ToString())
                {
                    if(item.Status==ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.PlanGoals.Update(item);
                    }
                    if(item.Name.Status== ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Name.Status=ApprovalStatus.ApprovedByUnitManager;
                        _context.GoalItems.Update(item.Name);
                    }
                    if (item.Indicator.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Indicator.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.GoalItems.Update(item.Indicator);
                    }
                    if (item.Descripition.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Descripition.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.GoalItems.Update(item.Descripition);
                    }
                }
                if (user.Role == RoleEnum.RegionManager.ToString())
                {
                    if (item.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.PlanGoals.Update(item);
                    }
                    if (item.Name.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Name.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.GoalItems.Update(item.Name);
                    }
                    if (item.Indicator.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Indicator.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.GoalItems.Update(item.Indicator);
                    }
                    if (item.Descripition.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Descripition.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.GoalItems.Update(item.Descripition);
                    }
                }
                if (user.Role == RoleEnum.HighManagement.ToString())
                {
                    if (item.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.PlanGoals.Update(item);
                    }
                    if (item.Name.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Name.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.GoalItems.Update(item.Name);
                    }
                    if (item.Indicator.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Indicator.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.GoalItems.Update(item.Indicator);
                    }
                    if (item.Descripition.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Descripition.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.GoalItems.Update(item.Descripition);
                    }
                }

            }
            // Never pull a plan that is already further on back to initiatives.
            if (user.Role == RoleEnum.HighManagement.ToString() && plan.CurrentStage < StrategicPlanLevels.InitiativesStage)
            {
                plan.CurrentStage = StrategicPlanLevels.InitiativesStage;
                _context.Plans.Update(plan);
            }
            plan.PlanGoalsStep.Status = Utils.GetApprovalStatusV2(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _context.PlanGoalsStep.Update(plan.PlanGoalsStep);
            await _context.SaveChangesAsync();
            var notifAction = actingRole == RoleEnum.HighManagement ? NotificationAction.FinalApprove : NotificationAction.Approve;
            await _notification.NotifyAsync(notifAction, ModulesNamesOnArabic.Objectives, unit, FormNameToReturnToFront.Goals, plan.Id, actingRole);

            // «إشعارات بمدى التقدم» — tell everyone the plan has entered the next
            // stage. Separate from the approval above, which only says the current
            // stage was accepted.
            if (actingRole == RoleEnum.HighManagement)
            {
                await _notification.NotifyAsync(NotificationAction.StageProgress, ModulesNamesOnArabic.Init, unit, FormNameToReturnToFront.init, plan.Id, actingRole, plan.Name);
            }


            return Ok(new { message = "ok" });


        }
        [Authorize(Policy = "Goals.GetAll")]
        [HttpGet("GetAcceptableAnalysisPoint/{PlanId}")]
        public async Task<IActionResult> GetAcceptableAnalysisPoint(int PlanId)
        {
            var points = await _context.AnalysisPoints.Where(i => i.PlanId == PlanId&&i.Status==ApprovalStatus.ApprovedByHighManagement).ToListAsync();
            if (points == null) return NotFound(new APIsGenralResponseDto<AddGoalDto>("Not Found", null));
            var f = new GetAcceptableAnalysis
            {
                Streanth = (ICollection<GetAcceptableAnalysisPointDto>)_mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<GetAcceptableAnalysisPointDto>>(points.Where(i => i.Type == AnalysisPointsType.Strength)),
                Risks = (ICollection<GetAcceptableAnalysisPointDto>)_mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<GetAcceptableAnalysisPointDto>>(points.Where(i => i.Type == AnalysisPointsType.Risk)),
                Opportunities = (ICollection<GetAcceptableAnalysisPointDto>)_mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<GetAcceptableAnalysisPointDto>>(points.Where(i => i.Type == AnalysisPointsType.Opportunity)),
                Threats = (ICollection<GetAcceptableAnalysisPointDto>)_mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<GetAcceptableAnalysisPointDto>>(points.Where(i => i.Type == AnalysisPointsType.Threat))
            };
          
            return Ok(f);
        }

    }

}

