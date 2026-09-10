namespace Mod.Service.Services.Implementation.PlanAnalysisService
{
    public class PlanAnalysisService : IPlanAnalysisService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICurrentUserService _currentUserService;
        private readonly UserManager<AppUser> _userManager;

        public PlanAnalysisService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<AppUser> userManager, ICurrentUserService userService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userManager = userManager;
            _currentUserService = userService;
        }
        public async Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> Approve(int PlanId, AppUser user)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
            var Plan = await _unitOfWork.Plans.GetById(PlanId);
            var PlanAnalysis = await _unitOfWork.PlanAnalysis.GetById((int)Plan.PlanAnalysisId);
            var PlanAnalysisAfterMapping = _mapper.Map<PlanAnalysisToReturnDto>(PlanAnalysis);

            switch (userRole)
            {
                case var role when role == RoleEnum.RegionManager.ToString():
                    return await ApproveByRegionManager(PlanId);

                case var role when role == RoleEnum.HighManagement.ToString():
                    return await ApproveByHighMangment(PlanId);

                case var role when role == RoleEnum.UnitManager.ToString():
                    return await ApproveByUnitManager(PlanId, user);

                default:
                    return new APIsGenralResponseDto<PlanAnalysisToReturnDto>("User role not authorized to Approve ", PlanAnalysisAfterMapping);
            }
        }

        public async Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> ApproveByHighMangment(int PlanId)
        {

            var PlanAnalysis = await _unitOfWork.PlanAnalysis.GetByPlanId(PlanId);
            var plan = await _unitOfWork.Plans.GetById(PlanId);
            plan.CurrentStage = StrategicPlanLevels.DirectionStage;
            _unitOfWork.Plans.Update(plan);
            PlanAnalysis.Status = Core.Enums.ApprovalStatus.ApprovedByHighManagement;
            
            foreach (var item in PlanAnalysis.AnalysisPoints)
            {
                if (item.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                {
                    item.Status = ApprovalStatus.ApprovedByHighManagement;

                }

                await _unitOfWork.AnalysisPoints.Update(item);
            }
            await _unitOfWork.PlanAnalysis.Update(PlanAnalysis);
            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.PlanAnalysis.Update(PlanAnalysis);
            await _unitOfWork.SaveChangesAsync();
            var PlanAnalysisAfterMapping = _mapper.Map<PlanAnalysisToReturnDto>(PlanAnalysis);
            return new APIsGenralResponseDto<PlanAnalysisToReturnDto>("Approved Succses", PlanAnalysisAfterMapping);
        }

        public async Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> ApproveByRegionManager(int PlanId)
        {
            var PlanAnalysis = await _unitOfWork.PlanAnalysis.GetByPlanId(PlanId);



            PlanAnalysis.Status = Core.Enums.ApprovalStatus.ApprovedByRegionManager;
            foreach (var item in PlanAnalysis.AnalysisPoints)
            {
                if (item.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                {
                    item.Status = ApprovalStatus.ApprovedByRegionManager;

                }
               
                await _unitOfWork.AnalysisPoints.Update(item);
            }
            await _unitOfWork.PlanAnalysis.Update(PlanAnalysis);
            await _unitOfWork.SaveChangesAsync();

            await _unitOfWork.PlanAnalysis.Update(PlanAnalysis);
            await _unitOfWork.SaveChangesAsync();
            var PlanAnalysisAfterMapping = _mapper.Map<PlanAnalysisToReturnDto>(PlanAnalysis);

            return new APIsGenralResponseDto<PlanAnalysisToReturnDto>("Approved Succses", PlanAnalysisAfterMapping);
        }

        public async Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> ApproveByUnitManager(int PlanId, AppUser user)
        {
            var PlanAnalysis = await _unitOfWork.PlanAnalysis.GetByPlanId(PlanId);
            PlanAnalysis.User = user;
            PlanAnalysis.DateOfApproval = DateTime.UtcNow;
            PlanAnalysis.Status = Core.Enums.ApprovalStatus.ApprovedByUnitManager;
            foreach (var item in PlanAnalysis.AnalysisPoints)
            {
                if (item.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                {
                    item.Status = ApprovalStatus.ApprovedByUnitManager;

                }
               
                await _unitOfWork.AnalysisPoints.Update(item);
            }
            await _unitOfWork.PlanAnalysis.Update(PlanAnalysis);
            await _unitOfWork.SaveChangesAsync();
            var PlanAnalysisAfterMapping = _mapper.Map<PlanAnalysisToReturnDto>(PlanAnalysis);
            return new APIsGenralResponseDto<PlanAnalysisToReturnDto>("Approved Succses", PlanAnalysisAfterMapping);
        }

        public async Task<APIsResponseFilterDto<PlanAnalysisToReturnDto>> GetAll(string? Type, AppUser user, int Page = 1, int PerPage = 2)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();

            switch (userRole)
            {
                case var role when role == RoleEnum.RegionManager.ToString():
                    return await GetAllForRegionManager(Type, user, Page, PerPage);
                case var role when role == RoleEnum.HighManagement.ToString():
                    return await GetAllForHighMangment(Type, Page, PerPage);
                default:
                    return new APIsResponseFilterDto<PlanAnalysisToReturnDto>
                    {
                        Data = new List<PlanAnalysisToReturnDto>(),
                        Metadata = new MetaDataDto()
                    };
            }
        }

        public async Task<APIsResponseFilterDto<PlanAnalysisToReturnDto>> GetAllForHighMangment(string? Type, int Page = 1, int PerPage = 2)
        {
            var allPlans = await _unitOfWork.PlanAnalysis.GetAll();
            var planMaster = await _unitOfWork.PlanMaster.GetLastMasterPlan();
            if (Type == "Current")
            {
                allPlans = allPlans.Where(i => i.Status == ApprovalStatus.ApprovedByUnitManager && i.Plan.MasterPlanId == planMaster.Id);

            }
            allPlans = allPlans.Where(i => i.Status == ApprovalStatus.ApprovedByRegionManager && i.Plan.MasterPlanId != planMaster.Id);

            int totalCount = allPlans.Count();

            var paginatedPlans = allPlans
                .Skip((Page - 1) * PerPage)
                .Take(PerPage)
                .ToList();

            var planDtos = _mapper.Map<IEnumerable<PlanAnalysis>, IEnumerable<PlanAnalysisToReturnDto>>(allPlans);

            var metadata = new MetaDataDto
            {
                CurrentPage = Page,
                PerPage = PerPage,
                Total = totalCount,
                LastPage = (int)Math.Ceiling(totalCount / (double)PerPage),
                From = totalCount > 0 ? ((Page - 1) * PerPage) + 1 : 0,
                To = Math.Min(Page * PerPage, totalCount)
            };

            var response = new APIsResponseFilterDto<PlanAnalysisToReturnDto>
            {
                Data = planDtos.ToList(),
                Metadata = metadata
            };

            return response;
        }

        public async Task<APIsResponseFilterDto<PlanAnalysisToReturnDto>> GetAllForHighMangment(int UnitId, string? CreatedDate = null, int Page = 1, int PerPage = 5)
        {
            var user = await _currentUserService.GetCurrentUserAsync();

            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
            if (userRole != RoleEnum.HighManagement.ToString() && userRole != RoleEnum.RegionManager.ToString())
                return new APIsResponseFilterDto<PlanAnalysisToReturnDto>
                {
                    Data = new List<PlanAnalysisToReturnDto>() { new PlanAnalysisToReturnDto() { Id = -1 } }, // -1 means not authorized
                    Metadata = new MetaDataDto()
                };


            var response = await _unitOfWork.PlanAnalysis.GetAllByManger(userRole, UnitId, CreatedDate);

            var totalCount = response.Count();

            if (totalCount < 1)
                return new APIsResponseFilterDto<PlanAnalysisToReturnDto>
                {
                    Data = new List<PlanAnalysisToReturnDto>() { },
                    Metadata = new MetaDataDto()
                };

            var paginatedPlans = await GetPaggination(response, PerPage, Page);

            var planDtos = _mapper.Map<IEnumerable<PlanAnalysis>, IEnumerable<PlanAnalysisToReturnDto>>(paginatedPlans);

            var metadata = await GetMetaData(totalCount, Page, PerPage);

            return new APIsResponseFilterDto<PlanAnalysisToReturnDto>
            {
                Data = planDtos.ToList(),
                Metadata = metadata
            };
        }

        public async Task<APIsResponseFilterDto<PlanAnalysisToReturnDto>> GetAllForRegionManager(string? Type, AppUser user, int Page = 1, int PerPage = 2)
        {
            var allPlans = await _unitOfWork.PlanAnalysis.GetAll();
            var AllUnits = await _unitOfWork.Unit.GetUserUnits(user);
            var planMaster = await _unitOfWork.PlanMaster.GetLastMasterPlan();
            if (Type == "Current")
            {
                allPlans = allPlans.Where(i =>
                     i.Status == ApprovalStatus.ApprovedByUnitManager &&
                     i.Plan.MasterPlanId == planMaster.Id &&
                     AllUnits.Any(u => u.Id == i.UnitId));
            }
            else
            {
                allPlans = allPlans.Where(i => i.Status == ApprovalStatus.ApprovedByHighManagement && i.Plan.MasterPlanId != planMaster.Id
                && AllUnits.Any(u => u.Id == i.UnitId));
            }

            int totalCount = allPlans.Count();

            // Apply pagination
            var paginatedPlans = allPlans
                .Skip((Page - 1) * PerPage)
                .Take(PerPage)
                .ToList();

            var planDtos = _mapper.Map<IEnumerable<PlanAnalysis>, IEnumerable<PlanAnalysisToReturnDto>>(allPlans);

            var metadata = new MetaDataDto
            {
                CurrentPage = Page,
                PerPage = PerPage,
                Total = totalCount,
                LastPage = (int)Math.Ceiling(totalCount / (double)PerPage),
                From = totalCount > 0 ? ((Page - 1) * PerPage) + 1 : 0,
                To = Math.Min(Page * PerPage, totalCount)
            };

            var response = new APIsResponseFilterDto<PlanAnalysisToReturnDto>
            {
                Data = planDtos.ToList(),
                Metadata = metadata
            };
            return response;
        }

        public async Task<APIsGenralResponseDto<PlanAnalysisToReturnDto>> GetById(int id)
        {
            var PlanAnalysisObj = await _unitOfWork.PlanAnalysis.GetByPlanId(id);
            var PlanAnalysisAfterMapping = _mapper.Map<PlanAnalysisToReturnDto>(PlanAnalysisObj);
            return new APIsGenralResponseDto<PlanAnalysisToReturnDto>("Succses", PlanAnalysisAfterMapping);
        }


        private async Task<List<PlanAnalysis>> GetPaggination(IEnumerable<PlanAnalysis> AllPlans, int PerPage = 5, int Page = 2)
        {
            int totalCount = AllPlans.Count();

            return AllPlans
                .Skip((Page - 1) * PerPage)
                .Take(PerPage)
                .ToList();
        }
        private async Task<MetaDataDto> GetMetaData(int totalCount, int Page, int PerPage)
        {
            return new MetaDataDto
            {
                CurrentPage = Page,
                PerPage = PerPage,
                Total = totalCount,
                LastPage = (int)Math.Ceiling(totalCount / (double)PerPage),
                From = totalCount > 0 ? ((Page - 1) * PerPage) + 1 : 0,
                To = Math.Min(Page * PerPage, totalCount)
            };
        }
    }
}
