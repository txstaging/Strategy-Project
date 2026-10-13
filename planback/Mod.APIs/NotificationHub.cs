using Microsoft.AspNetCore.SignalR;

public class NotificationHub : Hub
{




    public async Task SendToRoles(string[] roles, string message)
    {
        var tasks = roles.Select(role =>
            Clients.Group($"Role_{role}").SendAsync("ReceiveNotification", message)
        );
        await Task.WhenAll(tasks);
    }

    public async Task SendToUnits(string[] unitIds, string message)
    {
        var tasks = unitIds.Select(unitId =>
            Clients.Group($"Unit_{unitId}").SendAsync("ReceiveNotification", message)
        );
        await Task.WhenAll(tasks);
    }
    public async Task SendToRolesAndUnits(string[] roles, string[] unitIds, string message)
    {
        var roleTasks = roles?.Select(role =>
            Clients.Group($"Role_{role}").SendAsync("ReceiveNotification", message)
        ) ?? Enumerable.Empty<Task>();

        var unitTasks = unitIds?.Select(unitId =>
            Clients.Group($"Unit_{unitId}").SendAsync("ReceiveNotification", message)
        ) ?? Enumerable.Empty<Task>();

        await Task.WhenAll(roleTasks.Concat(unitTasks));
    }
    public async Task SendToMultipleUnitsAndManagers(string[] unitIds, string message)
    {
        var tasks = unitIds.SelectMany(unitId => new[]
        {
        Clients.Group($"Role_UnitManager_{unitId}").SendAsync("ReceiveNotification", message),
        //Clients.Group($"Unit_{unitId}").SendAsync("ReceiveNotification", message)
    });

        await Task.WhenAll(tasks);
    }





    public override async Task OnConnectedAsync()
    {
        var user = Context.User;

        // استخراج الأدوار
        var roles = user?.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList() ?? new List<string>();

        // استخراج وحدة المستخدم
        var unitId = user?.Claims.FirstOrDefault(c => c.Type == "unitId")?.Value;

        // A group of one, so a notification addressed to a named person (a
        // feedback request, for example) can reach just them in real time.
        var userId = user?.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        }

        // الانضمام لمجموعات الأدوار
        foreach (var role in roles)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Role_{role}");
        }

        // الانضمام لمجموعة الوحدة
        if (!string.IsNullOrEmpty(unitId))
        {
            if (!roles.Contains("UnitManager"))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Unit_{unitId}");
            }


            // ✅ لو المستخدم هو مدير وحدة، ضيفه لجروب مخصص باسمه + وحدته
            if (roles.Contains("UnitManager"))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, $"Role_UnitManager_{unitId}");
                // Also join the broad role group so BroadcastPlan (which targets Role_UnitManager) reaches them.
                await Groups.AddToGroupAsync(Context.ConnectionId, "Role_UnitManager");
            }
        }

        await base.OnConnectedAsync();
    }


}
