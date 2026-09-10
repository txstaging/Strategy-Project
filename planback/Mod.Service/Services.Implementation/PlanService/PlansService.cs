namespace Mod.Service.Services.Implementation.PlanService
{
    public class PlansService(IUnitOfWork unitOfWork, IMapper mapper, ICurrentUserService currentUserService) : IPlanService
    {
        private readonly IUnitOfWork _unitOfWork = unitOfWork;
        private readonly IMapper _mapper = mapper;
        private readonly ICurrentUserService _currentUserService = currentUserService;

        public async Task<APIsResponseFilterDto<GetAllPlanDto>> GetAll(
            string? Filter,
            int? Unit,
            int? Year,
            int Page,
            int PerPage
        )
        {
            var user = await _currentUserService.GetCurrentUserAsync();

            var allPlans = await _unitOfWork.Plans.GetAll();

            // Filter units not related to the user  

            allPlans = allPlans.OrderByDescending(i => i.Id).ToList();
            // Applying Recent filter  
            // Keep only the latest plan for each unit  
            var currentPlans = allPlans
                .GroupBy(plan => plan.UnitId)
                .Select(group => group.OrderByDescending(plan => plan.Id)
                .First());
            if (Filter == "Current")
            {
                // Keep only the latest plan for each unit  
                allPlans = currentPlans;
            }
            else if (Filter == "Old")
            {
                // the inverse of the current plans  
                allPlans = allPlans.Except(currentPlans);
            }

            // Applying Year Filter  
            if (Year.HasValue)
            {
                allPlans = allPlans
                    .Where(plan => plan.CreatedAt.Value.Year == Year.Value);
            }

            // Applying Unit Filter  
            if (Unit.HasValue)
            {
                allPlans = allPlans
                    .Where(plan => plan.UnitId == Unit);
            }
            if (user.Role == RoleEnum.UnitEmployee.ToString() || user.Role == RoleEnum.UnitManager.ToString())
            {
                allPlans = allPlans.Where(i => i.UnitId == user.UnitId);
            }

            var totalItems = allPlans.Count(); // Ensure totalItems is defined here  

            var pagedPlans = allPlans
                .Skip((Page - 1) * PerPage)
                .Take(PerPage)
                .Select(plan => new GetAllPlanDto
                {
                    Id = plan.Id,
                    Name = plan.Name,
                    Unit = _mapper.Map<UnitsToReturnDto>(plan.Units),
                    PlanAnalysis = _mapper.Map<PlanAnalysisToReturnDto>(plan.PlanAnalysis),
                    CurrentStage = plan.CurrentStage.ToString(),
                })
                .ToList();

            var metadata = new MetaDataDto
            {
                CurrentPage = Page,
                From = ((Page - 1) * PerPage) + 1,
                To = Math.Min(Page * PerPage, totalItems), // Fix for CS0103: totalItems  
                PerPage = PerPage,
                LastPage = (int)Math.Ceiling((double)totalItems / PerPage),
                Total = totalItems
            };

            return new APIsResponseFilterDto<GetAllPlanDto>
            {
                Data = pagedPlans,
                Metadata = metadata
            };
        }
    
     public async Task<APIsGenralResponseDto<GetAllPlanDto>> GetById(int id)
        {
            var plan = await _unitOfWork.Plans.GetById(id);
            if (plan == null) return new APIsGenralResponseDto<GetAllPlanDto>("Plan Not Found", null);
            var PlanAfterMapping = new GetAllPlanDto
            {
                Id = plan.Id,
                Name = plan.Name,
                Unit = _mapper.Map<UnitsToReturnDto>(plan.Units),
                CurrentStage = plan.CurrentStage.ToString(),

            };
            return new APIsGenralResponseDto<GetAllPlanDto>("Susses", PlanAfterMapping);
        }
    }
}





       


