//namespace Mod.Service.Services.Implementation.DirectionItemsService
//{
//    public class DirectionItemsService : IDirectionItemsService
//    {
//        private readonly IUnitOfWork _unitOfWork;
//        private readonly IMapper _mapper;
//        private readonly ModContext _context;
//        private readonly ICurrentUserService _currentUser;

//        public DirectionItemsService(IUnitOfWork unitOfWork, IMapper mapper, ModContext context, ICurrentUserService currentUser)
//        {
//            _unitOfWork = unitOfWork;
//            _mapper = mapper;
//            _currentUser = currentUser;
//            _context = context ?? throw new ArgumentNullException(nameof(context));
//        }


//        public async Task<APIsGenralResponseDto<AddDirectionItemsDto>> Add(AddDirectionItemsDto element, int PlanID)
//        {
//            var plan = await _unitOfWork.Plans.GetById(PlanID);
//            element.Type = char.ToUpper(element.Type[0]) + element.Type.Substring(1);
//            CultureInfo culture = new CultureInfo("en-US");

//            var Direction = await _unitOfWork.PlanDirection.GetById(PlanID);

//            foreach (var item in element.DirectionItemsElements)
//            {
//                item.Status = ApprovalStatus.Pending.ToString();
//            }

//            switch (element.Type)
//            {
//                case "Message":
//                    Direction.Message.Name = element.Name;
//                    RemoveEntities(Direction.Message.DirectionItemsElements);
//                    Direction.Message.DirectionItemsElements = _mapper.Map<IEnumerable<DirectionItemsElementsDto>, ICollection<DirectionItemsElements>>(element.DirectionItemsElements);
//                    await _unitOfWork.PlanDirection.Update(Direction);
//                    break;

//                case "Value":
//                    Direction.Value.Name = element.Name;
//                    RemoveEntities(Direction.Value.DirectionItemsElements);
//                    Direction.Value.DirectionItemsElements = _mapper.Map<IEnumerable<DirectionItemsElementsDto>, ICollection<DirectionItemsElements>>(element.DirectionItemsElements);
//                    await _unitOfWork.PlanDirection.Update(Direction);
//                    break;

//                case "Vision":
//                    Direction.Vision.Name = element.Name;
//                    RemoveEntities(Direction.Vision.DirectionItemsElements);
//                    Direction.Vision.DirectionItemsElements = _mapper.Map<IEnumerable<DirectionItemsElementsDto>, ICollection<DirectionItemsElements>>(element.DirectionItemsElements);
//                    await _unitOfWork.PlanDirection.Update(Direction);
//                    break;

//                default:
//                    throw new ArgumentException("Invalid Type value provided.", nameof(element.Type));
//            }

//            await _unitOfWork.SaveChangesAsync();
//            return new APIsGenralResponseDto<AddDirectionItemsDto>("Success", element);
//        }

//        private void RemoveEntities(IEnumerable<DirectionItemsElements> entities)
//        {
//            foreach (var entity in entities)
//            {
//                _context.Entry(entity).State = EntityState.Deleted;
//            }
//        }

//        private static DirectionItems GetDirectionItemByType(string type, PlanDirection direction)
//        {
//            if (type == StrategicDirectionPointType.Message.ToString())
//            {
//                return direction.Message;
//            }
//            else if (type == StrategicDirectionPointType.Value.ToString())
//            {
//                return direction.Value;
//            }
//            else if (type == StrategicDirectionPointType.Vision.ToString())
//            {
//                return direction.Vision;
//            }
//            else
//            {
//                throw new ArgumentException("Invalid Type value provided.", nameof(type));
//            }
//        }

//        public async Task<APIsGenralResponseDto<AddDirectionItemsDto>> Get(string type, int PlanID)
//        {
//            type = char.ToUpper(type[0]) + type.Substring(1);
//            var direction = await _unitOfWork.PlanDirection.GetById(PlanID);
//            var directionItem = GetDirectionItemByType(type, direction);

//            var objAfterMapping = new AddDirectionItemsDto
//            {
//                Name = directionItem.Name,
//                DirectionItemsElements = _mapper.Map<ICollection<DirectionItemsElements>, ICollection<DirectionItemsElementsDto>>(directionItem.DirectionItemsElements),
//            };

//            return new APIsGenralResponseDto<AddDirectionItemsDto>("Succses", objAfterMapping);

//        }

//        public async Task<APIsGenralResponseDto<AddDirectionItemsDto>> Approve(string type, int PlanID)
//        {
//            type = char.ToUpper(type[0]) + type.Substring(1);
//            var user = await _currentUser.GetCurrentUserAsync();
//            var Direction = await _unitOfWork.PlanDirection.GetById(PlanID);
//            var DirectionItem = GetDirectionItemByType(type, Direction);

//            DirectionItem.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));

//            await _unitOfWork.DirectionItems.Update(DirectionItem);
//            await _unitOfWork.SaveChangesAsync();

//            return new APIsGenralResponseDto<AddDirectionItemsDto>("Approved Successfully", new AddDirectionItemsDto());
//        }

//        public async Task<APIsGenralResponseDto<AddDirectionItemsDto>> Reject(string type, int PlanID)
//        {
//            type = char.ToUpper(type[0]) + type.Substring(1);
//            var user = await _currentUser.GetCurrentUserAsync();
//            var Direction = await _unitOfWork.PlanDirection.GetById(PlanID);
//            var DirectionItem = GetDirectionItemByType(type, Direction);

//            DirectionItem.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));

//            await _unitOfWork.DirectionItems.Update(DirectionItem);

//            await _unitOfWork.SaveChangesAsync();

//            return new APIsGenralResponseDto<AddDirectionItemsDto>("Rejected Successfully", new AddDirectionItemsDto());
//        }

//        public async Task<APIsGenralResponseDto<AddDirectionItemsDto>> Return(string type, int PlanID)
//        {
//            type = char.ToUpper(type[0]) + type.Substring(1);
//            var user = await _currentUser.GetCurrentUserAsync();
//            var Direction = await _unitOfWork.PlanDirection.GetById(PlanID);
//            var DirectionItem = GetDirectionItemByType(type, Direction);

//            DirectionItem.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));

//            await _unitOfWork.DirectionItems.Update(DirectionItem);
//            await _unitOfWork.SaveChangesAsync();

//            return new APIsGenralResponseDto<AddDirectionItemsDto>("Returned Successfully", new AddDirectionItemsDto());
//        }
//    }
//}
