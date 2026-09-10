//using Microsoft.AspNetCore.Identity;
//using Microsoft.AspNetCore.SignalR;
//using Mod.Core.Services.Contract.NotificationService;

//namespace Mod.APIs
//{
//    public class NotificationService : INotificationService
//    {
//        private readonly ModContext _context;
//        private readonly IHubContext<NotificationHub> _hub;
//        private readonly RoleManager<UserRole> _roleManager;

//        public NotificationService(ModContext context, IHubContext<NotificationHub> hub, RoleManager<UserRole> roleManager)
//        {
//            _context = context;
//            _hub = hub;
//            _roleManager = roleManager;
//        }

//        public async Task AddPlanNotification(string planName, string? userId)
//        {
//            // استثناء الإدارة العليا
//            var roles = _roleManager.Roles
//                .Where(r => r.Name != "HighManagement")
//                .Select(r => r.Name)
//                .ToList();
//            var  Message = $"تم إضافة خطة جديدة: {planName}";

//            foreach (var role in roles)
//            {
//                var notification = new Notification
//                {
//                    Role = role,
//                    Message = Message,
//                    IsRead = false,
                    
//                    CreatedAt = DateTime.UtcNow
//                };

//                // أضف الإشعار إلى قاعدة البيانات
//                _context.Notification.Add(notification);

//                // أرسل الإشعار عبر SignalR
//                await _hub.Clients.Group($"Role_{role}")
//                    .SendAsync("ReceiveNotification", Message);
//            }

//            // حفظ التغييرات في قاعدة البيانات
//            await _context.SaveChangesAsync();
//        }

       

//        public Task RejectOrReturnPoint(AppUser user, Flag flag, string UnitId, StrategicPlanLevels levels)
//        {
//            throw new NotImplementedException();
//        }
      
//    }
//}
