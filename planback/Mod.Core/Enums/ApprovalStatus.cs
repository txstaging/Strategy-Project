namespace Mod.Core.Enums
{
    public enum ApprovalStatus
    {
        Pending = 1,

        ApprovedByUnitManager,
        ApprovedByUnitManagerPartially,
        RejectedByUnitManager,
        ReturnedByUnitManager,

        RejectedByRegionManager,
        ReturnedByRegionManager,
        ApprovedByRegionManagerPartially,
        ApprovedByRegionManager,

        RejectedByHighManagement,
        ReturnedByHighManagement,
        ApprovedByHighManagement,
        ApprovedByHighManagementPartially,

        All,
        SavedAsDraft
    }
}
