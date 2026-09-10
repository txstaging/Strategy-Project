using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mod.Core.Utils;

namespace Mod.APIs.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUser;

        public NotificationController(ModContext context, ICurrentUserService currentUser)
        {
            _context = context;
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var currentUser = await _currentUser.GetCurrentUserAsync();
            if (currentUser == null)
                return Unauthorized();

            var query = BuildUserQuery(currentUser);

            var items = (await query
                .OrderByDescending(n => n.Id)
                .Select(n => new
                {
                    n.Id,
                    n.Message,
                    n.IsRead,
                    n.FormNameToReturnToFront,
                    planId = n.FormId
                }).ToListAsync())
                .Select(n => new NotificationItemDto
                {
                    Id = n.Id,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    FormNameToReturnToFront = n.FormNameToReturnToFront.GetDisplayName(),
                    planId = n.planId
                }).ToList();

            var notificationsDto = new NotificationDto
            {
                Count = items.Count(i => !i.IsRead),
                Notifications = items
            };

            return Ok(notificationsDto);
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var currentUser = await _currentUser.GetCurrentUserAsync();
            if (currentUser == null)
                return Unauthorized();

            var notification = await _context.Notification
                .Include(n => n.NotificationRolesTargets)
                .FirstOrDefaultAsync(n => n.Id == id && n.IsDeleted != true);

            if (notification == null)
                return NotFound();

            if (!IsAuthorized(currentUser, notification))
                return Forbid();

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var currentUser = await _currentUser.GetCurrentUserAsync();
            if (currentUser == null)
                return Unauthorized();

            var unread = await BuildUserQuery(currentUser)
                .Where(n => !n.IsRead)
                .ToListAsync();

            if (unread.Count > 0)
            {
                foreach (var n in unread)
                    n.IsRead = true;

                await _context.SaveChangesAsync();
            }

            return Ok();
        }

        private IQueryable<Notification> BuildUserQuery(AppUser user)
        {
            var role = user.Role;
            var unitId = user.UnitId;

            IQueryable<Notification> query = _context.Notification
                .Where(n => n.IsDeleted != true);

            if (role == nameof(RoleEnum.UnitEmployee) || role == nameof(RoleEnum.UnitManager))
            {
                query = query.Where(i => i.NotificationRolesTargets.Any(n => n.Role == role && (n.UnitId == unitId || n.UnitId == null)));
            }
            else if (role == nameof(RoleEnum.RegionManager) || role == nameof(RoleEnum.HighManagement))
            {
                query = query.Where(i => i.NotificationRolesTargets.Any(n => n.Role == role));
            }

            return query;
        }

        private static bool IsAuthorized(AppUser user, Notification notification)
        {
            var role = user.Role;
            var unitId = user.UnitId;

            if (role == nameof(RoleEnum.UnitEmployee) || role == nameof(RoleEnum.UnitManager))
            {
                return notification.NotificationRolesTargets
                    .Any(nrt => nrt.Role == role && (nrt.UnitId == unitId || nrt.UnitId == null));
            }

            return notification.NotificationRolesTargets
                .Any(nrt => nrt.Role == role);
        }

        public class NotificationDto
        {
            public int Count { get; set; }
            public List<NotificationItemDto> Notifications { get; set; }
        }

        public class NotificationItemDto
        {
            public int Id { get; set; }
            public string Message { get; set; }
            public bool IsRead { get; set; }
            public string FormNameToReturnToFront { get; set; }
            public int? planId { get; set; }
        }
    }
}
