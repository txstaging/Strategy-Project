//namespace Mod.Service.Services.Implementation.PlanDirectionService
//{
//    public class PlanDirectionService : IPlanDirectionService
//    {
//        private readonly IUnitOfWork _unitOfWork;
//        private readonly IMapper _mapper;
//        private readonly UserManager<AppUser> _userManager;

//        public PlanDirectionService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<AppUser> userManager)
//        {
//            _unitOfWork = unitOfWork;
//            _mapper = mapper;
//            _userManager = userManager;
//        }
//        public async Task<APIsGenralResponseDto<PlanDirectionDto>> Approve(int PlanId, AppUser user)
//        {
//            var obj = await _unitOfWork.PlanDirection.GetById(PlanId);
//            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
//            switch (userRole)
//            {
//                case var role when role == RoleEnum.RegionManager.ToString():
//                    return await ApproveByRegionManager(PlanId);
//                case var role when role == RoleEnum.HighManagement.ToString():
//                    return await ApproveByHighMangment(PlanId);
//                case var role when role == RoleEnum.UnitManager.ToString():
//                    return await ApproveByUnitManager(PlanId);
//                default:
//                    return new APIsGenralResponseDto<PlanDirectionDto>("User role not authorized to Approve ", null);
//            }

//        }

//        public async Task<APIsGenralResponseDto<PlanDirectionDto>> ApproveByHighMangment(int PlanId)
//        {
//            var obj = await _unitOfWork.PlanDirection.GetById(PlanId);
//            obj.Status = ApprovalStatus.ApprovedByHighManagement;
//            var plan = await _unitOfWork.Plans.GetById(PlanId);
//            plan.CurrentStage = StrategicPlanLevels.DirectionStage;
//            _unitOfWork.Plans.Update(plan);
//            await _unitOfWork.PlanDirection.Update(obj);
//            await _unitOfWork.SaveChangesAsync();
//            var respons = new PlanDirectionDto
//            {
//                id = obj.Id,
//                unit = _mapper.Map<UnitsToReturnDto>(obj.Units),
//                PlanId = obj.PlanId,
//                status = ApprovalStatus.ApprovedByHighManagement.ToString(),
//                items = new ItemDto { message = _mapper.Map<MessageDto>(obj.Message), value = _mapper.Map<ValueDto>(obj.Value), Vision = _mapper.Map<VisionDto>(obj.Vision) },


//            };
//            respons.items.Vision.elements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Vision.DirectionItemsElements);
//            respons.items.value.elements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Value.DirectionItemsElements);
//            respons.items.message.elements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Message.DirectionItemsElements);
//            return new APIsGenralResponseDto<PlanDirectionDto>("Succses", respons);
//        }

//        public async Task<APIsGenralResponseDto<PlanDirectionDto>> ApproveByRegionManager(int PlanId)
//        {
//            var obj = await _unitOfWork.PlanDirection.GetById(PlanId);
//            obj.Status = ApprovalStatus.ApprovedByRegionManager;
//            await _unitOfWork.PlanDirection.Update(obj);
//            await _unitOfWork.SaveChangesAsync();
//            var respons = new PlanDirectionDto
//            {
//                id = obj.Id,
//                unit = _mapper.Map<UnitsToReturnDto>(obj.Units),
//                PlanId = obj.PlanId,
//                status = ApprovalStatus.ApprovedByRegionManager.ToString(),
//                items = new ItemDto { message = _mapper.Map<MessageDto>(obj.Message), value = _mapper.Map<ValueDto>(obj.Value), Vision = _mapper.Map<VisionDto>(obj.Vision) },


//            };
//            respons.items.Vision.elements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Vision.DirectionItemsElements);
//            respons.items.value.elements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Value.DirectionItemsElements);
//            respons.items.message.elements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Message.DirectionItemsElements);
//            return new APIsGenralResponseDto<PlanDirectionDto>("Succses", respons);
//        }

//        public async Task<APIsGenralResponseDto<PlanDirectionDto>> ApproveByUnitManager(int PlanId)
//        {
//            var obj = await _unitOfWork.PlanDirection.GetById(PlanId);
//            if (obj.Status == ApprovalStatus.Pending)
//            {
//                obj.Status = ApprovalStatus.ApprovedByUnitManager;
//                obj.Vision.Status = ApprovalStatus.ApprovedByUnitManager;
//                obj.Value.Status = ApprovalStatus.ApprovedByUnitManager;
//                obj.Message.Status = ApprovalStatus.ApprovedByUnitManager;
//                await _unitOfWork.PlanDirection.Update(obj);
//            }
//            else
//            {
//                foreach (var item in obj.Vision.DirectionItemsElements)
//                {
//                    if (item.Status == ApprovalStatus.ReturnedByHighManagement || item.Status == ApprovalStatus.ReturnedByRegionManager)
//                    {
//                        item.Status = ApprovalStatus.ApprovedByUnitManager;

//                        await _unitOfWork.DirectionItemsElements.Update(item);
//                    }
//                }
//            }
//            await _unitOfWork.SaveChangesAsync();
//            var respons = new PlanDirectionDto
//            {
//                id = obj.Id,
//                unit = _mapper.Map<UnitsToReturnDto>(obj.Units),
//                PlanId = obj.PlanId,
//                status = ApprovalStatus.ApprovedByUnitManager.ToString(),
//                items = new ItemDto { message = _mapper.Map<MessageDto>(obj.Message), value = _mapper.Map<ValueDto>(obj.Value), Vision = _mapper.Map<VisionDto>(obj.Vision) },


//            };
//            respons.items.Vision.elements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Vision.DirectionItemsElements);
//            respons.items.value.elements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Value.DirectionItemsElements);
//            respons.items.message.elements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Message.DirectionItemsElements);
//            return new APIsGenralResponseDto<PlanDirectionDto>("Succses", respons);

//        }

//        public async Task<APIsGenralResponseDto<PlanDirectionDto>> GetById(int PlanId)
//        {
//            var obj = await _unitOfWork.PlanDirection.GetById(PlanId);
//            var respons = new PlanDirectionDto
//            {
//                id = obj.Id,
//                unit = _mapper.Map<UnitsToReturnDto>(obj.Units),
//                PlanId = obj.PlanId,
//                status = obj.Status.ToString(),
//                items = new ItemDto { message = _mapper.Map<MessageDto>(obj.Message), value = _mapper.Map<ValueDto>(obj.Value), Vision = _mapper.Map<VisionDto>(obj.Vision) },
//            };
//            respons.items.Vision.elements = [.. _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Vision.DirectionItemsElements).OrderBy(e => e.Id)];
//            respons.items.value.elements = [.. _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Value.DirectionItemsElements).OrderBy(e => e.Id)];
//            respons.items.message.elements = [.. _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(obj.Message.DirectionItemsElements).OrderBy(e => e.Id)];
//            return new APIsGenralResponseDto<PlanDirectionDto>("Succses", respons);
//        }
//    }
//}
