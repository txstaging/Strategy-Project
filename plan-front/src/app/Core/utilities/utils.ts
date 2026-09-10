import {
  ApprovalStatusEnum,
  FinishedByHighManagement,
  FinishedByRegionManager,
  RolesEnums,
} from './consts';

export function getUserInfo() {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : {};
}

export function shouldShowStepSubmissionButton(
  status: ApprovalStatusEnum,
  userRole: RolesEnums | null
): boolean {
  if (!userRole) return false;
  const approvalFlow: any = {
    [ApprovalStatusEnum.Pending]: RolesEnums.UnitManager,
    [ApprovalStatusEnum.ApprovedByUnitManager]: RolesEnums.RegionManager,
    [ApprovalStatusEnum.ApprovedByRegionManager]: RolesEnums.HighManagement,
  };

  return approvalFlow[status] === userRole;
}

export function isActionAlreadyTakenByTheCurrentManager(
  status: string,
  userRole: string
) {
  const isRegionManagerActionTaken =
    userRole === RolesEnums.RegionManager &&
    FinishedByRegionManager.includes(status as ApprovalStatusEnum);
  const isHighManagementActionTaken =
    userRole === RolesEnums.HighManagement &&
    FinishedByHighManagement.includes(status as ApprovalStatusEnum);

  return isRegionManagerActionTaken || isHighManagementActionTaken;
}

export function convertArabicNumbersToEnglish(input: string) {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let output = input;
  for (let i = 0; i < arabicNumbers.length; i++) {
    const regex = new RegExp(arabicNumbers[i], 'g');
    output = String(output).replace(regex, englishNumbers[i]);
  }
  return output;
}
