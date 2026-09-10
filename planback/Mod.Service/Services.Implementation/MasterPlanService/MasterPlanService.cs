namespace Mod.Service.Services.Implementation.PlansService
{
    public class MasterPlanService : IMasterPlanService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ModContext _context;
        private readonly ICurrentUserService _currentUserService;

        public MasterPlanService(IUnitOfWork unitOfWork, ModContext context,ICurrentUserService currentUserService)
        {
            _unitOfWork = unitOfWork;
            _context = context;
            _currentUserService = currentUserService;
        }


        public async Task<APIsGenralResponseDto<AddPlansDto>> Add(AddPlansDto plan)
        {
            var user=await _currentUserService.GetCurrentUserAsync();
            if(user.Role!=RoleEnum.HighManagement.ToString())
            {
                return new APIsGenralResponseDto<AddPlansDto>("You are not authorized to add a plan", null);
            }
            var allUnits = await _unitOfWork.Unit.GetAll();
            var newPlan = new PlanMaster
            {
                name = plan.Name,
                CreatedAt = DateTime.UtcNow

            };
            _context.PlanMaster.Add(newPlan);
            await _unitOfWork.SaveChangesAsync();

            if (allUnits == null || !allUnits.Any())
            {
                return new APIsGenralResponseDto<AddPlansDto>("No units found", null);
            }

            foreach (var unit in allUnits)
            {
                var planUnit = new Plans
                {
                    Name = plan.Name,
                    Units = unit,
                    CreatedAt = DateTime.UtcNow,
                    Status = ApprovalStatus.Pending,
                    PlanMaster = newPlan
                };
                _context.Plans.Add(planUnit);
                await _unitOfWork.SaveChangesAsync();
                var PlanAnalysis = new PlanAnalysis
                {
                    CreatedAt = DateTime.UtcNow,
                    Units = unit,
                    UnitId = unit.Id,
                    Status = ApprovalStatus.Pending,
                    Plan = planUnit,
                    PlanId = planUnit.Id

                };
                _context.PlanAnalysis.Add(PlanAnalysis);
                await _unitOfWork.SaveChangesAsync();


                var PlanDirection = new PlanDirection
                {
                    CreatedAt = DateTime.UtcNow,
                    Units = unit,
                    Status = ApprovalStatus.Pending,
                    Plan = planUnit,
                    PlanId = planUnit.Id,
                    


                };
                var planGoalsStep=new PlanGoalsStep
                {
                    CreatedAt = DateTime.UtcNow,
                    Units = unit,
                    Status = ApprovalStatus.Pending,
                    Plan = planUnit,
                    PlanId = planUnit.Id,
                   
                };
                _context.PlanGoalsStep.Add(planGoalsStep);
                var planInitiativeStep = new PlanInitiativeStep
                {
                    CreatedAt = DateTime.UtcNow,
                    Units = unit,
                    Status = ApprovalStatus.Pending,
                    Plan = planUnit,
                    PlanId = planUnit.Id,
                };
                _context.PlanInitiativeStep.Add(planInitiativeStep);
                var planProjectsStep = new PlanProjectsStep
                {
                    CreatedAt = DateTime.UtcNow,
                    Units = unit,
                    Status = ApprovalStatus.Pending,
                    Plan = planUnit,
                    PlanId = planUnit.Id,
                };
                _context.PlanProjectsStep.Add(planProjectsStep);



                _context.PlanDirection.Add(PlanDirection);
                await _unitOfWork.SaveChangesAsync();
                planUnit.PlanDirection = PlanDirection;
                planUnit.PlanDirectionId = PlanDirection.Id;
                planUnit.PlanGoalsStep = planGoalsStep;
                planUnit.PlanGoalsStepId = planGoalsStep.Id;
                planUnit.PlanInitiativeStep = planInitiativeStep;
                planUnit.planInitiativeStepId = planInitiativeStep.Id;
                planUnit.PlanProjectsStep = planProjectsStep;
                planUnit.planProjectsStepId = planProjectsStep.Id;

                _context.PlanDirection.Update(PlanDirection);
                _context.Plans.Update(planUnit);
                await _unitOfWork.SaveChangesAsync();

            }

            //foreach (var plananalysis in newPlan.Plans)
            //{
            //    plananalysis.PlanAnalysis= new PlanAnalysis { Plan=plananalysis ,Units=plananalysis.Units,Status=ApprovalStatus.Pending,CreatedAt=DateTime.UtcNow};

            //}

            plan.Id = newPlan.Id;
            return new APIsGenralResponseDto<AddPlansDto>("Success", plan);
        }

        public Task<APIsGenralResponseDto<Plans>> Delete(int id)
        {
            throw new NotImplementedException();
        }


        public Task<APIsGenralResponseDto<AddPlansDto>> Update(AddPlansDto plan)
        {
            throw new NotImplementedException();
        }
    }
}
