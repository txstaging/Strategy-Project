using Mod.Core.DTOs.ProgressShare;
using Mod.Core.DTOs.Report;
using Mod.Core.Services.Contract;
using Mod.Core.Utils;

namespace Mod.APIs.Controllers
{
    // «مشاركة نسبة الإنجاز» — from the reports stage, a user sends the progress
    // figure of a project, an initiative or a whole unit to people they choose.
    // Each recipient gets it in their notification list, and clicking it opens
    // the shared figure with a link through to the live report.
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProgressShareController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;
        private readonly INotificationService _notification;
        private readonly IReportService _reports;

        public ProgressShareController(ModContext context, ICurrentUserService currentUser, INotificationService notification, IReportService reports)
        {
            _context = context;
            _currentUser = currentUser;
            _notification = notification;
            _reports = reports;
        }

        // Everything that can be shared, with the figure it currently stands at.
        // Flattened from the same roll-up the reports table shows, so the sender
        // picks from exactly what they can see there.
        [HttpGet("options")]
        public async Task<IActionResult> Options()
        {
            var tree = await _reports.GetAll();
            return Ok(Flatten(tree));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProgressShareDto dto)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var userIds = dto.UserIds?.Distinct().Where(id => id != user.Id).ToList() ?? new List<int>();
            if (userIds.Count == 0)
                return BadRequest(new { message = "يجب اختيار مستخدم واحد على الأقل" });

            // The figure is read from the live roll-up at the moment of sending,
            // never trusted from the client.
            var option = Flatten(await _reports.GetAll())
                .FirstOrDefault(o => o.Scope == dto.Scope && o.ScopeId == dto.ScopeId);
            if (option == null)
                return NotFound(new { message = "العنصر المطلوب غير موجود في التقارير" });

            var share = new ProgressShare
            {
                SentByUserId = user.Id,
                Scope = dto.Scope,
                ScopeId = dto.ScopeId,
                ScopeName = option.Name,
                Percentage = option.Percentage,
                PlanId = option.PlanId,
                Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim(),
            };
            foreach (var id in userIds)
                share.Recipients.Add(new ProgressShareRecipient { UserId = id });

            _context.ProgressShares.Add(share);
            await _context.SaveChangesAsync();

            var headline = "شارك " + user.DisplayName + " نسبة إنجاز " + ScopeLabel(dto.Scope)
                         + " «" + option.Name + "»: " + option.Percentage.ToString("0.##") + "%";
            if (share.Note != null) headline += " — " + share.Note;

            await _notification.NotifyRecipientsAsync(headline, FormNameToReturnToFront.progress, share.Id, Array.Empty<int>(), userIds);

            return Ok(new { id = share.Id, message = "ok" });
        }

        // Shares sent to me, newest first.
        [HttpGet("inbox")]
        public async Task<IActionResult> Inbox()
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var list = await BaseQuery()
                .Where(s => s.Recipients.Any(r => r.UserId == user.Id))
                .OrderByDescending(s => s.Id)
                .ToListAsync();

            return Ok(list.Select(s => Map(s, user, null)).ToList());
        }

        // Shares I sent.
        [HttpGet("sent")]
        public async Task<IActionResult> Sent()
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var list = await BaseQuery()
                .Where(s => s.SentByUserId == user.Id)
                .OrderByDescending(s => s.Id)
                .ToListAsync();

            return Ok(list.Select(s => Map(s, user, null)).ToList());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOne(int id)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user == null) return Unauthorized();

            var share = await BaseQuery().FirstOrDefaultAsync(s => s.Id == id);
            if (share == null) return NotFound(new { message = "المشاركة غير موجودة" });

            var canSee = share.SentByUserId == user.Id
                      || user.Role == nameof(RoleEnum.Admin)
                      || share.Recipients.Any(r => r.UserId == user.Id);
            if (!canSee)
                return StatusCode(403, new { message = "ليس لديك صلاحية لعرض هذه المشاركة" });

            // The detail view also carries the current figure, so a recipient can
            // tell whether progress has moved since it was shared.
            var live = Flatten(await _reports.GetAll())
                .FirstOrDefault(o => o.Scope == share.Scope && o.ScopeId == share.ScopeId)?.Percentage;

            return Ok(Map(share, user, live));
        }

        private IQueryable<ProgressShare> BaseQuery() =>
            _context.ProgressShares
                .Where(s => s.IsDeleted != true)
                .Include(s => s.SentByUser)
                .Include(s => s.Recipients).ThenInclude(r => r.User).ThenInclude(u => u!.Units);

        // Walk the unit → goal → initiative → project tree into one flat list of
        // shareable things, each carrying its rolled-up figure.
        private static List<ProgressOptionDto> Flatten(List<UnitReport> tree)
        {
            var list = new List<ProgressOptionDto>();

            foreach (var unit in tree)
            {
                list.Add(new ProgressOptionDto
                {
                    Scope = ProgressScope.Unit,
                    ScopeId = unit.UnitId,
                    Name = unit.UnitName,
                    Percentage = unit.UnitPercentage ?? 0,
                    UnitName = unit.UnitName,
                });

                foreach (var goal in unit.Goals)
                {
                    foreach (var initiative in goal.Initiatives)
                    {
                        list.Add(new ProgressOptionDto
                        {
                            Scope = ProgressScope.Initiative,
                            ScopeId = initiative.InitiativeId,
                            Name = initiative.InitiativeName,
                            Percentage = initiative.InitiativePercentage ?? 0,
                            UnitName = unit.UnitName,
                        });

                        foreach (var project in initiative.Projects)
                        {
                            list.Add(new ProgressOptionDto
                            {
                                Scope = ProgressScope.Project,
                                ScopeId = project.ProjectId,
                                Name = project.ProjectName,
                                Percentage = project.Percentage ?? 0,
                                UnitName = unit.UnitName,
                            });
                        }
                    }
                }
            }

            return list;
        }

        private static string ScopeLabel(ProgressScope scope) => scope switch
        {
            ProgressScope.Project => "المشروع",
            ProgressScope.Initiative => "المبادرة",
            ProgressScope.Unit => "الوحدة",
            _ => "العنصر",
        };

        private static ProgressShareDto Map(ProgressShare s, AppUser viewer, double? live) => new()
        {
            Id = s.Id,
            Scope = s.Scope.ToString(),
            ScopeId = s.ScopeId,
            ScopeName = s.ScopeName,
            Percentage = s.Percentage,
            LivePercentage = live,
            PlanId = s.PlanId,
            Note = s.Note,
            CreatedAt = s.CreatedAt,
            SentByUserId = s.SentByUserId,
            SentByName = s.SentByUser?.DisplayName,
            IsMine = s.SentByUserId == viewer.Id,
            Recipients = s.Recipients.Select(r => new ProgressShareRecipientDto
            {
                UserId = r.UserId,
                UserName = r.User?.DisplayName,
                UnitName = r.User?.Units?.Name,
            }).ToList(),
        };
    }
}
