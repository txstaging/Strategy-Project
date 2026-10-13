using Mod.Core.DTOs.Feedback;
using Mod.Core.Utils;

namespace Mod.APIs.Controllers
{
    // «طلب المرئيات والتغذية الراجعة» — checklist item 14.
    //
    // A platform official addresses a question about part of a plan to chosen
    // units or named people. Each addressee gets it in their notification list,
    // opens it, and answers. The requester sees every answer in one place.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FeedbackController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;
        private readonly INotificationService _notification;

        public FeedbackController(ModContext context, ICurrentUserService currentUser, INotificationService notification)
        {
            _context = context;
            _currentUser = currentUser;
            _notification = notification;
        }

        // Asking for views is a supervisory act, so it sits with the roles that
        // review the plan rather than with the employees who fill it in.
        private static bool CanRequestFeedback(string? role) =>
            role == nameof(RoleEnum.UnitManager)
            || role == nameof(RoleEnum.RegionManager)
            || role == nameof(RoleEnum.HighManagement)
            || role == nameof(RoleEnum.Admin);

        // Plans the caller may ask about, by name, for the composer's plan picker.
        // Unit-level roles see their own unit's plans; everyone above sees all.
        [HttpGet("plans")]
        public async Task<IActionResult> Plans()
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var query = _context.Plans.Where(p => p.IsDeleted != true).Include(p => p.Units).AsQueryable();
            if (user.Role == nameof(RoleEnum.UnitEmployee) || user.Role == nameof(RoleEnum.UnitManager))
                query = query.Where(p => p.UnitId == user.UnitId);

            var plans = await query
                .OrderByDescending(p => p.Id)
                .Select(p => new { id = p.Id, name = p.Name, unitName = p.Units.Name })
                .ToListAsync();

            return Ok(plans);
        }

        // Items inside one stage of one plan, by name, so the composer can offer
        // "this specific project" instead of asking for a database number.
        [HttpGet("subjects")]
        public async Task<IActionResult> Subjects([FromQuery] int planId, [FromQuery] FormNameToReturnToFront subject)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var items = subject switch
            {
                FormNameToReturnToFront.analysisstage => await _context.AnalysisPoints
                    .Where(a => a.PlanId == planId && a.IsDeleted != true)
                    .Select(a => new { id = a.Id, name = a.Name }).ToListAsync(),

                FormNameToReturnToFront.directionstage => await _context.DirectionItems
                    .Where(d => d.PlanDirection.PlanId == planId && d.IsDeleted != true)
                    .Select(d => new { id = d.Id, name = d.Name }).ToListAsync(),

                FormNameToReturnToFront.Goals => await _context.PlanGoals
                    .Where(g => g.PlanId == planId && g.IsDeleted != true)
                    .Select(g => new { id = g.Id, name = g.Name.Value }).ToListAsync(),

                FormNameToReturnToFront.init => await _context.PlanInitiatives
                    .Where(i => i.PlanId == planId && i.IsDeleted != true)
                    .Select(i => new { id = i.Id, name = i.Name.Value }).ToListAsync(),

                FormNameToReturnToFront.project => await _context.PlanProjects
                    .Where(pr => pr.PlanId == planId && pr.IsDeleted != true)
                    .Select(pr => new { id = pr.Id, name = pr.Name.Value }).ToListAsync(),

                // The plan itself and the reports stage have no sub-items to pick.
                _ => new List<object>().Select(_ => new { id = 0, name = string.Empty }).ToList(),
            };

            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateFeedbackRequestDto dto)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (!CanRequestFeedback(user.Role))
                return StatusCode(403, new { message = "ليس لديك صلاحية لطلب المرئيات" });

            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "نص الطلب مطلوب" });

            var unitIds = dto.UnitIds?.Distinct().ToList() ?? new List<int>();
            var userIds = dto.UserIds?.Distinct().ToList() ?? new List<int>();
            if (unitIds.Count == 0 && userIds.Count == 0)
                return BadRequest(new { message = "يجب اختيار وحدة واحدة على الأقل أو مستخدم واحد على الأقل" });

            var plan = await _context.Plans.FirstOrDefaultAsync(p => p.Id == dto.PlanId);
            if (plan == null) return NotFound(new { message = "الخطة غير موجودة" });

            var request = new FeedbackRequest
            {
                Message = dto.Message.Trim(),
                RequestedByUserId = user.Id,
                PlanId = dto.PlanId,
                Subject = dto.Subject,
                SubjectId = dto.SubjectId,
                DueDate = dto.DueDate,
            };

            foreach (var unitId in unitIds)
                request.Recipients.Add(new FeedbackRequestRecipient { UnitId = unitId });
            foreach (var userId in userIds)
                request.Recipients.Add(new FeedbackRequestRecipient { UserId = userId });

            _context.FeedbackRequests.Add(request);
            await _context.SaveChangesAsync();

            // The wording the requester typed is what the addressee needs to read,
            // so it is the notification body rather than a generic headline.
            var headline = "طلب إبداء مرئيات على " + SubjectLabel(dto.Subject) + ": " + request.Message;
            await _notification.NotifyRecipientsAsync(headline, FormNameToReturnToFront.feedback, request.Id, unitIds, userIds);

            return Ok(new { id = request.Id, message = "ok" });
        }

        // Requests addressed to the caller, newest first.
        [HttpGet("inbox")]
        public async Task<IActionResult> Inbox([FromQuery] int? planId = null)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var query = BaseQuery().Where(f => f.Recipients.Any(r => r.UserId == user.Id || (r.UnitId != null && r.UnitId == user.UnitId)));
            if (planId != null) query = query.Where(f => f.PlanId == planId);

            var list = await query.OrderByDescending(f => f.Id).ToListAsync();
            return Ok(await MapAllAsync(list, user));
        }

        // Requests the caller sent, with the answers gathered so far.
        [HttpGet("sent")]
        public async Task<IActionResult> Sent([FromQuery] int? planId = null)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var query = BaseQuery().Where(f => f.RequestedByUserId == user.Id);
            if (planId != null) query = query.Where(f => f.PlanId == planId);

            var list = await query.OrderByDescending(f => f.Id).ToListAsync();
            return Ok(await MapAllAsync(list, user));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var request = await BaseQuery().FirstOrDefaultAsync(f => f.Id == id);
            if (request == null) return NotFound(new { message = "الطلب غير موجود" });

            if (!CanSee(request, user))
                return StatusCode(403, new { message = "ليس لديك صلاحية لعرض هذا الطلب" });

            var dto = Map(request, user);
            dto.SubjectName = await ResolveSubjectNameAsync(request.Subject, request.SubjectId);
            return Ok(dto);
        }

        [HttpPost("{id}/respond")]
        public async Task<IActionResult> Respond(int id, [FromBody] AddFeedbackResponseDto dto)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "نص المرئيات مطلوب" });

            var request = await BaseQuery().FirstOrDefaultAsync(f => f.Id == id);
            if (request == null) return NotFound(new { message = "الطلب غير موجود" });

            if (request.IsClosed)
                return BadRequest(new { message = "تم إغلاق هذا الطلب" });

            if (!IsRecipient(request, user))
                return StatusCode(403, new { message = "هذا الطلب غير موجه إليك" });

            var response = new FeedbackResponse
            {
                FeedbackRequestId = request.Id,
                RespondedByUserId = user.Id,
                UnitId = user.UnitId,
                Message = dto.Message.Trim(),
            };
            _context.FeedbackResponses.Add(response);
            await _context.SaveChangesAsync();

            // «وتلقّي الإجابات» — the answer travels back to whoever asked.
            var unitName = user.Units?.Name ?? (await _context.Units.FirstOrDefaultAsync(u => u.Id == user.UnitId))?.Name;
            var who = string.IsNullOrEmpty(unitName) ? user.DisplayName : user.DisplayName + " (" + unitName + ")";
            var headline = "تم استلام مرئيات من " + who + ": " + response.Message;
            await _notification.NotifyRecipientsAsync(
                headline,
                FormNameToReturnToFront.feedback,
                request.Id,
                Array.Empty<int>(),
                new[] { request.RequestedByUserId });

            return Ok(new { id = response.Id, message = "ok" });
        }

        // Closing stops further answers without discarding the ones already given.
        [HttpPost("{id}/close")]
        public async Task<IActionResult> Close(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var request = await _context.FeedbackRequests.FirstOrDefaultAsync(f => f.Id == id);
            if (request == null) return NotFound(new { message = "الطلب غير موجود" });

            if (request.RequestedByUserId != user.Id && user.Role != nameof(RoleEnum.Admin))
                return StatusCode(403, new { message = "لا يمكن إغلاق طلب لم ترسله" });

            request.IsClosed = true;
            request.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "ok" });
        }

        private async Task<List<FeedbackRequestDto>> MapAllAsync(List<FeedbackRequest> list, AppUser viewer)
        {
            var result = new List<FeedbackRequestDto>(list.Count);
            foreach (var f in list)
            {
                var dto = Map(f, viewer);
                dto.SubjectName = await ResolveSubjectNameAsync(f.Subject, f.SubjectId);
                result.Add(dto);
            }
            return result;
        }

        // Looks up the current name of the item a request points at, so the
        // screen can say "المشروع: صيانة المستودعات" rather than "رقم العنصر: 9".
        private async Task<string?> ResolveSubjectNameAsync(FormNameToReturnToFront subject, int? subjectId)
        {
            if (subjectId == null || subjectId == 0) return null;
            var id = subjectId.Value;

            return subject switch
            {
                FormNameToReturnToFront.analysisstage => await _context.AnalysisPoints.Where(a => a.Id == id).Select(a => a.Name).FirstOrDefaultAsync(),
                FormNameToReturnToFront.directionstage => await _context.DirectionItems.Where(d => d.Id == id).Select(d => d.Name).FirstOrDefaultAsync(),
                FormNameToReturnToFront.Goals => await _context.PlanGoals.Where(g => g.Id == id).Select(g => g.Name.Value).FirstOrDefaultAsync(),
                FormNameToReturnToFront.init => await _context.PlanInitiatives.Where(i => i.Id == id).Select(i => i.Name.Value).FirstOrDefaultAsync(),
                FormNameToReturnToFront.project => await _context.PlanProjects.Where(p => p.Id == id).Select(p => p.Name.Value).FirstOrDefaultAsync(),
                _ => null,
            };
        }

        private IQueryable<FeedbackRequest> BaseQuery() =>
            _context.FeedbackRequests
                .Where(f => f.IsDeleted != true)
                .Include(f => f.RequestedByUser)
                .Include(f => f.Plan)
                .Include(f => f.Recipients).ThenInclude(r => r.Unit)
                .Include(f => f.Recipients).ThenInclude(r => r.User)
                .Include(f => f.Responses).ThenInclude(r => r.RespondedByUser)
                .Include(f => f.Responses).ThenInclude(r => r.Unit);

        private static bool IsRecipient(FeedbackRequest request, AppUser user) =>
            request.Recipients.Any(r => r.UserId == user.Id || (r.UnitId != null && r.UnitId == user.UnitId));

        private static bool CanSee(FeedbackRequest request, AppUser user) =>
            request.RequestedByUserId == user.Id
            || user.Role == nameof(RoleEnum.Admin)
            || IsRecipient(request, user);

        private static string SubjectLabel(FormNameToReturnToFront subject) => subject switch
        {
            FormNameToReturnToFront.plans => "الخطة الاستراتيجية",
            FormNameToReturnToFront.analysisstage => "التحليل",
            FormNameToReturnToFront.directionstage => "التوجه الاستراتيجي",
            FormNameToReturnToFront.Goals => "الأهداف",
            FormNameToReturnToFront.init => "المبادرات",
            FormNameToReturnToFront.project => "المشاريع",
            FormNameToReturnToFront.reports => "التقارير",
            FormNameToReturnToFront.communication => "خطة التواصل والمجازفات",
            _ => "الخطة الاستراتيجية",
        };

        private static FeedbackRequestDto Map(FeedbackRequest f, AppUser viewer)
        {
            var respondedUserIds = f.Responses.Select(r => r.RespondedByUserId).ToHashSet();
            var respondedUnitIds = f.Responses.Where(r => r.UnitId != null).Select(r => r.UnitId!.Value).ToHashSet();

            return new FeedbackRequestDto
            {
                Id = f.Id,
                Message = f.Message,
                PlanId = f.PlanId,
                PlanName = f.Plan?.Name,
                Subject = f.Subject.GetDisplayName(),
                SubjectId = f.SubjectId,
                DueDate = f.DueDate,
                IsClosed = f.IsClosed,
                CreatedAt = f.CreatedAt,
                RequestedByUserId = f.RequestedByUserId,
                RequestedByName = f.RequestedByUser?.DisplayName,
                IsMine = f.RequestedByUserId == viewer.Id,
                ResponseCount = f.Responses.Count,
                Recipients = f.Recipients.Select(r => new FeedbackRecipientDto
                {
                    UnitId = r.UnitId,
                    UnitName = r.Unit?.Name,
                    UserId = r.UserId,
                    UserName = r.User?.DisplayName,
                    HasResponded = r.UserId != null
                        ? respondedUserIds.Contains(r.UserId.Value)
                        : r.UnitId != null && respondedUnitIds.Contains(r.UnitId.Value),
                }).ToList(),
                Responses = f.Responses.OrderBy(r => r.Id).Select(r => new FeedbackResponseDto
                {
                    Id = r.Id,
                    Message = r.Message,
                    RespondedByUserId = r.RespondedByUserId,
                    RespondedByName = r.RespondedByUser?.DisplayName,
                    UnitName = r.Unit?.Name,
                    CreatedAt = r.CreatedAt,
                }).ToList(),
            };
        }
    }
}
