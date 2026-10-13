using Mod.Core.Entities.Initiative;
using Mod.Core.Utils;

namespace Mod.APIs
{
    // Status filters for the stage listings.
    //
    // These used to be six hand-maintained whitelists, one per entity, which had
    // drifted apart from each other. The region manager whitelist in particular
    // omitted RejectedByUnitManager and ReturnedByUnitManager, so an item that
    // blocked stage approval became invisible to the manager who had to clear it,
    // and the plan could never be completed. Every "default" branch also mixed
    // && and || without parentheses and was true for any input, so it filtered
    // nothing at all.
    //
    // All six now defer to Utils.IsVisibleTo, which holds the single rule.
    public static class func
    {
        public static Func<DirectionItemsElements, bool> GetFilter(RoleEnum role)
            => x => Utils.IsVisibleTo(x.Status, role);

        public static Func<PlanGoals, bool> GetFilterGoal(RoleEnum role)
            => x => Utils.IsVisibleTo(x.Status, role);

        public static Func<PlanInitiative, bool> GetFilterInitiative(RoleEnum role)
            => x => Utils.IsVisibleTo(x.Status, role);

        public static Func<InitiativeItem, bool> GetFilterInitiativeItem(RoleEnum role)
            => x => Utils.IsVisibleTo(x.Status, role);

        public static Func<InitiativeKpi, bool> GetFilterInitiativeKpis(RoleEnum role)
            => x => Utils.IsVisibleTo(x.Status, role);

        public static Func<PlanProjects, bool> GetFilterProject(RoleEnum role)
            => x => Utils.IsVisibleTo(x.Status, role);
    }
}
