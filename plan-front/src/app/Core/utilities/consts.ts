export const ROLES = {
  Admin: 'Admin',
  UnitEmployee: 'UnitEmployee',
  UnitManager: 'UnitManager',
  RegionManager: 'RegionManager',
  HighManagement: 'HighManagement',
};

export const HIGH_MANAGEMENT_ROLES = [
  ROLES.UnitManager,
  ROLES.RegionManager,
  ROLES.HighManagement,
];

export const STRATEGIC_PLAN_STAGES = {
  Analysis: {
    path: 'analysis-stage',
    buttonText: 'الي التحليل',
  },
  Direction: {
    path: 'direction-stage',
    buttonText: 'الي التوجه الاستراتيجي',
  },
};

export enum RolesEnums {
  UnitEmployee = 'UnitEmployee',
  UnitManager = 'UnitManager',
  RegionManager = 'RegionManager',
  HighManagement = 'HighManagement',
}
export enum RolesStepEnums {
  UnitEmployee = 1,
  UnitManager = 2,
  RegionManager = 3,
  HighManagement = 4,
}

export enum ApprovalStatusEnum {
  Pending = 'Pending',

  ApprovedByUnitManager = 'ApprovedByUnitManager',
  ApprovedByUnitManagerPartially = 'ApprovedByUnitManagerPartially',
  ReturnedByUnitManager = 'ReturnedByUnitManager',
  RejectedByUnitManager = 'RejectedByUnitManager',

  RejectedByRegionManager = 'RejectedByRegionManager',
  ReturnedByRegionManager = 'ReturnedByRegionManager',
  ApprovedByRegionManager = 'ApprovedByRegionManager',
  ApprovedByRegionManagerPartially = 'ApprovedByRegionManagerPartially',

  RejectedByHighManagement = 'RejectedByHighManagement',
  ReturnedByHighManagement = 'ReturnedByHighManagement',
  ApprovedByHighManagement = 'ApprovedByHighManagement',
  ApprovedByHighManagementPartially = 'ApprovedByHighManagementPartially',
  SavedAsDraft='SavedAsDraft'
}

export const StatusesArabicNames = {
  Approved: 'تم القبول',
  Returned: 'تم الاسترجاع',
  Rejected: 'تم الرفض',
  [ApprovalStatusEnum.Pending]: 'قيد الانتظار',
  [ApprovalStatusEnum.ApprovedByUnitManager]: 'قيد الانتظار',
  [ApprovalStatusEnum.ApprovedByUnitManagerPartially]:
    'تم القبول من مدير الوحدة',
  [ApprovalStatusEnum.ReturnedByUnitManager]: 'تم الاسترجاع من مدير الوحدة',
  [ApprovalStatusEnum.RejectedByUnitManager]: 'تم الرفض من مدير الوحدة',
  [ApprovalStatusEnum.RejectedByRegionManager]: 'تم الرفض من مدير المنطقة',
  [ApprovalStatusEnum.ReturnedByRegionManager]: 'تم الاسترجاع من مدير المنطقة',
  [ApprovalStatusEnum.ApprovedByRegionManager]: 'تم القبول من مدير المنطقة',
  [ApprovalStatusEnum.SavedAsDraft]: 'تم الحفظ فى المسودة',
  [ApprovalStatusEnum.ApprovedByRegionManagerPartially]:
    'تم القبول من مدير المنطقة',
  [ApprovalStatusEnum.RejectedByHighManagement]: 'تم الرفض',
  [ApprovalStatusEnum.ReturnedByHighManagement]: 'تم الاسترجاع',
  [ApprovalStatusEnum.ApprovedByHighManagement]: 'تم القبول',
  [ApprovalStatusEnum.ApprovedByHighManagementPartially]: 'تم القبول',
};

export const PendingStatuses = [ApprovalStatusEnum.Pending];

export const ApprovalStatuses = [
  ApprovalStatusEnum.ApprovedByUnitManager,
  ApprovalStatusEnum.ApprovedByUnitManagerPartially,
  ApprovalStatusEnum.ApprovedByRegionManager,
  ApprovalStatusEnum.ApprovedByRegionManagerPartially,
  ApprovalStatusEnum.ApprovedByHighManagement,
  ApprovalStatusEnum.ApprovedByHighManagementPartially,
];

export const RejectionStatuses = [
  ApprovalStatusEnum.RejectedByUnitManager,
  ApprovalStatusEnum.RejectedByRegionManager,
  ApprovalStatusEnum.RejectedByHighManagement,
];

export const ReturnedStatuses = [
  ApprovalStatusEnum.ReturnedByUnitManager,
  ApprovalStatusEnum.ReturnedByRegionManager,
  ApprovalStatusEnum.ReturnedByHighManagement,
];

export const FinishedByRegionManager = [
  ApprovalStatusEnum.ApprovedByRegionManager,
  ApprovalStatusEnum.RejectedByRegionManager,
  ApprovalStatusEnum.ReturnedByRegionManager,
  ApprovalStatusEnum.ApprovedByUnitManagerPartially,
  ApprovalStatusEnum.ApprovedByRegionManagerPartially,
  ApprovalStatusEnum.ApprovedByHighManagementPartially,
];

export const FinishedByHighManagement = [
  ApprovalStatusEnum.ApprovedByHighManagement,
  ApprovalStatusEnum.RejectedByHighManagement,
  ApprovalStatusEnum.ReturnedByHighManagement,
  ApprovalStatusEnum.ApprovedByHighManagementPartially,
];
