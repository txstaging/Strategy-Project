using Mod.Core.Mapping.PlanDirection;
using Mod.Core.Utils;
using Mod.Service.Services.Implementation.CurrentUserService;
using Newtonsoft.Json.Linq;
using QuestPDF.Infrastructure;

namespace Mod.APIs.Controllers
{
    [Route("/api/Plans/{PlanId}/PlanDirection")]
    [ApiController]
    [Authorize]

    public class PlanDirectionController : BaseController
    {

       
        private readonly ICurrentUserService _currentUser;
        private readonly ModContext _context;
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notification;

        public PlanDirectionController(ICurrentUserService currentUser, ModContext context, IUnitOfWork unitOfWork, INotificationService notificationService)
        {

            _currentUser = currentUser;
            _context = context;
            _unitOfWork = unitOfWork;
            _notification = notificationService;
           
        }

        [HttpPost("Approve/{PlanDirectionId}")]
        [Authorize(Policy = "Direction.Approve")]
        public async Task<ActionResult<APIsGenralResponseDto<PlanDirectionDto>>> Approve(int PlanDirectionId)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            var result =await _context.PlanDirection.Where(i=>i.Id==PlanDirectionId).Include(i=>i.DirectionItems).ThenInclude(i=>i.DirectionItemsElements).FirstOrDefaultAsync(i=>i.Id==PlanDirectionId);
            // Notify the PLAN's unit (employee + unit manager), not the approver's
            // unit — otherwise region/high management approvals never reach the
            // plan's employees.
            var unit = await _context.Units.FirstOrDefaultAsync(i => i.Id == result.UnitId)
                       ?? await _context.Units.Where(i => i.Id == user.UnitId).FirstOrDefaultAsync();
            var actingRole = Enum.Parse<RoleEnum>(user!.Role!);
            var directionStatuses = new List<ApprovalStatus?>();
            foreach (var it in result.DirectionItems)
            {
                directionStatuses.Add(it.Status);
                directionStatuses.AddRange(it.DirectionItemsElements.Select(e => (ApprovalStatus?)e.Status));
            }
            if (directionStatuses.Any(s => Utils.IsRejectedOrReturned(s)))
            {
                return BadRequest(new { message = "لا يمكن اعتماد المرحلة لوجود عناصر مرفوضة أو مُرجعة أو لم يتم اتخاذ إجراء عليها بعد" });
            }
            result.Status = Utils.GetApprovalStatusV2(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _context.PlanDirection.Update(result);
            if (result.Status == ApprovalStatus.ApprovedByHighManagement)
            {
                var plan = await _context.Plans.FindAsync(result.PlanId);
                plan.CurrentStage = StrategicPlanLevels.GoalsStage;
                _context.Plans.Update(plan);
            }
            if(user.Role==RoleEnum.RegionManager.ToString())
            {
                foreach (var item in result.DirectionItems)
                {
                    if(item.Status==ApprovalStatus.ApprovedByRegionManagerPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByRegionManager;
                        _context.DirectionItems.Update(item);
                    }
                    
                 
                }

            }
            else if (user.Role == RoleEnum.HighManagement.ToString())
            {
                foreach (var item in result.DirectionItems)
                {
                    if (item.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByHighManagement;
                        _context.DirectionItems.Update(item);
                    }

                }

            }
            else if (user.Role == RoleEnum.UnitManager.ToString())
            {
                foreach (var item in result.DirectionItems)
                {
                    if (item.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                    {
                        item.Status = ApprovalStatus.ApprovedByUnitManager;
                        _context.DirectionItems.Update(item);
                    }

                }


            }
            foreach(var item in result.DirectionItems)
            {
                foreach (var element in item.DirectionItemsElements)
                {
                    if (user.Role == RoleEnum.UnitManager.ToString())
                    {
                        if(element.Status == ApprovalStatus.ApprovedByUnitManagerPartially)
                        {
                            element.Status = ApprovalStatus.ApprovedByUnitManager;
                        }
                        

                       

                    }
                    else if (user.Role == RoleEnum.RegionManager.ToString())
                    {

                        if (element.Status == ApprovalStatus.ApprovedByRegionManagerPartially)
                        {
                            element.Status = ApprovalStatus.ApprovedByRegionManager;
                        }

                    }
                    else if (user.Role == RoleEnum.HighManagement.ToString())
                    {

                        if (element.Status == ApprovalStatus.ApprovedByHighManagementPartially)
                        {
                            element.Status = ApprovalStatus.ApprovedByHighManagement;
                        }

                    }
                    _context.DirectionItemsElements.Update(element);
                }
            }
            await _context.SaveChangesAsync();
            var notifAction = actingRole == RoleEnum.HighManagement ? NotificationAction.FinalApprove : NotificationAction.Approve;
            await _notification.NotifyAsync(notifAction, ModulesNamesOnArabic.Direction, unit, FormNameToReturnToFront.directionstage, result.PlanId, actingRole);
            return Ok(new {Message="ok"});
        }

        [HttpGet]
        [Authorize(Policy = "Direction.GetOne")]
        public async Task<ActionResult<APIsGenralResponseDto<PlanDirectionDto>>> GetById(int PlanId)
        {
            var plan = await _context.Plans.Where(i => i.Id == PlanId).Include(i => i.PlanDirection).ThenInclude(i=>i.DirectionItems).ThenInclude(i=>i.DirectionItemsElements).FirstOrDefaultAsync(i => i.Id == PlanId);
            var planDirection = await _context.PlanDirection.Where(i => i.Id == plan.PlanDirectionId).Include(i => i.DirectionItems).ThenInclude(i => i.DirectionItemsElements).FirstOrDefaultAsync(i => i.Id == plan.PlanDirectionId);
            var directionitem = await _context.DirectionItems.Where(i=>i.PlanDirectionId==planDirection.Id).Include(i=>i.DirectionItemsElements).ToListAsync();
            
            if (planDirection == null)
                return NotFound(new APIsGenralResponseDto<PlanDirectionDto>("PlanDirection not found", null));
            var user = await _currentUser.GetCurrentUserAsync();
            if(user.Role == RoleEnum.UnitManager.ToString())
            {
               directionitem = directionitem.Where(p => p.Status !=ApprovalStatus.SavedAsDraft).ToList();
            }
            else if (user.Role == RoleEnum.RegionManager.ToString())
            {
                directionitem=directionitem.Where(p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially).ToList();

            }
            else if (user.Role == RoleEnum.HighManagement.ToString())
            {
               directionitem=directionitem.Where(i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially && i.Status! != ApprovalStatus.ReturnedByUnitManager && i.Status != ApprovalStatus.RejectedByUnitManager).ToList();
                
            }

            var response = new PlanDirectionDto
            {
                id = planDirection.Id,
                status = ((ApprovalStatus)planDirection.Status).ToString(),
                getAllDirectionDtoResponse = new GetAllDirectionDtoResponse
                {
                    Vision = directionitem
                        .Where(i => i.Type == StrategicDirectionPointType.Vision).OrderByDescending(i=>i.Id)
                        .Select(i => new GetAllDirectionDto
                        {
                            Id = i.Id,
                            status = ((ApprovalStatus)i.Status).ToString(),
                            comment = i.Comment,
                            DirectionItemsElements = i.DirectionItemsElements.Where(func.GetFilter(Enum.Parse<RoleEnum>(user!.Role!))).Select(e => new GetAllDirectionItemElementDto
                            {
                                Id = e.Id,
                                value = e.Name,
                                comment = e.Comment,
                                status = ((ApprovalStatus)e.Status).ToString()
                            }).OrderByDescending(i => i.Id).ToList()
                        }).ToList(),
                    Value = directionitem
                        .Where(i => i.Type == StrategicDirectionPointType.Value).OrderByDescending(i => i.Id)
                        .Select(i => new GetAllDirectionDto
                        {
                            Id = i.Id,
                            status = ((ApprovalStatus)i.Status).ToString(),
                            comment = i.Comment,
                            DirectionItemsElements = i.DirectionItemsElements.Where(func.GetFilter(Enum.Parse<RoleEnum>(user!.Role!))).Select(e => new GetAllDirectionItemElementDto
                            {
                                Id = e.Id,
                                value = e.Name,
                                comment = e.Comment,
                                status = ((ApprovalStatus)e.Status).ToString()
                            }).OrderByDescending(i => i.Id).ToList()
                        }).ToList(),
                    Message = directionitem
                        .Where(i => i.Type == StrategicDirectionPointType.Message).OrderByDescending(i => i.Id)
                        .Select(i => new GetAllDirectionDto
                        {
                            Id = i.Id,
                            status = ((ApprovalStatus)i.Status).ToString(),
                            comment = i.Comment,
                            DirectionItemsElements = i.DirectionItemsElements.Where(func.GetFilter(Enum.Parse<RoleEnum>(user!.Role!))).Select(e => new GetAllDirectionItemElementDto
                            {
                                Id = e.Id,
                                value = e.Name,
                                comment = e.Comment,
                                status = ((ApprovalStatus)e.Status).ToString()
                            }).OrderByDescending(i => i.Id).ToList()
                        }).ToList()
                }
            };
          

            return Ok(new APIsGenralResponseDto<PlanDirectionDto>("ok", response));
        }

        [HttpGet("GetAll")]
        [Authorize(Policy = "Direction.GetAll")]
        public async Task<ActionResult<APIsResponseFilterDto<GetAllPlanDirectionDto>>> GetAll([FromQuery] string? Filter, [FromQuery] int perPage = 5, [FromQuery] int page = 0)
        {
            var user = await _currentUser.GetCurrentUserAsync();
            if (user.Role == RoleEnum.UnitManager.ToString() || user.Role == RoleEnum.UnitEmployee.ToString())
            {
                return await GetAllForUnitAsync((int)user.UnitId, Filter, perPage, page);
            }

            else if (user.Role == RoleEnum.RegionManager.ToString())
            {
                return await GetAllForRegionManagerAsync(Filter, perPage, page);
            }
            else if (user.Role == RoleEnum.HighManagement.ToString())
            {
                return await GetAllForHighAsync(Filter, perPage, page);
            }
            return new ActionResult<APIsResponseFilterDto<GetAllPlanDirectionDto>>(new APIsResponseFilterDto<GetAllPlanDirectionDto>());
        }
        private async Task<APIsResponseFilterDto<GetAllPlanDirectionDto>> GetAllForUnitAsync(
     int unitid,
     [FromQuery] string? Filter,
     [FromQuery] int perPage = 5,
     [FromQuery] int page = 0)
        {
            var all = _context.PlanDirection
              .AsQueryable();
            var list = new List<PlanDirection>();
            var planMaster = await _unitOfWork.PlanMaster.GetLastMasterPlan();


            if (string.Equals(Filter, "Current", StringComparison.OrdinalIgnoreCase))
            {
                all = all.Where(i => i.Plan.MasterPlanId==planMaster.Id && i.UnitId == unitid);
                list = all.Where(i => i.Plan.MasterPlanId == planMaster.Id && i.UnitId == unitid).ToList();

            }
            else if (string.Equals(Filter, "Archived", StringComparison.OrdinalIgnoreCase))
            {
                all = all.Where(i => i.Plan.MasterPlanId != planMaster.Id && i.UnitId == unitid);
                list = all.Where(i => i.Plan.MasterPlanId != planMaster.Id && i.UnitId == unitid).ToList();

            }
            bool flag = list.Any();
            int totalCount = list.Count();
            int lastPage = (int)Math.Ceiling((double)totalCount / perPage);
            int from = totalCount == 0 ? 0 : ((page - 1) * perPage) + 1;
            int to = Math.Min(page * perPage, totalCount);


            if (!flag)
            {
                return new APIsResponseFilterDto<GetAllPlanDirectionDto>
                {
                    Data = new List<GetAllPlanDirectionDto>(),
                    Metadata = new MetaDataDto
                    {
                        CurrentPage = page,
                        PerPage = perPage,
                        LastPage = lastPage,
                        Total = totalCount,
                        From = from,
                        To = to
                    }
                };
            }

            totalCount = all.Count();
            lastPage = (int)Math.Ceiling((double)totalCount / perPage);
            from = totalCount == 0 ? 0 : ((page - 1) * perPage) + 1;

            to = Math.Min(page * perPage, totalCount);

            var paginatedData = all
     .OrderBy(i => i.Id)
     .Skip((page - 1) * perPage)
     .Take(perPage)

                .Select(i => new GetAllPlanDirectionDto
                {
                    Id = i.Id,
                    Name = i.Units.Name,
                    username=i.User.UserName,
                    date = i.CreatedAt.ToString(),


                    // Map other properties as needed
                })
                .ToList();

            return new APIsResponseFilterDto<GetAllPlanDirectionDto>
            {
                Data = paginatedData,
                Metadata = new MetaDataDto
                {
                    CurrentPage = page,
                    PerPage = perPage,
                    LastPage = lastPage,
                    Total = totalCount,
                    From = from,
                    To = to
                }
            };
        }

        private async Task<APIsResponseFilterDto<GetAllPlanDirectionDto>> GetAllForRegionManagerAsync([FromQuery] string? Filter, [FromQuery] int perPage = 5, [FromQuery] int page = 0)
        {
            var all = _context.PlanDirection
            .AsQueryable();
            var list = new List<PlanDirection>();
            var planMaster = await _unitOfWork.PlanMaster.GetLastMasterPlan();

            if (string.Equals(Filter, "Current", StringComparison.OrdinalIgnoreCase))
            {
                all = all.Where(i => i.Plan.MasterPlanId == planMaster.Id && i.Status != ApprovalStatus.Pending);
                list = all.Where(i => i.Plan.MasterPlanId == planMaster.Id && i.Status != ApprovalStatus.Pending).ToList();

            }
            else if (string.Equals(Filter, "Archived", StringComparison.OrdinalIgnoreCase))
            {
                all = all.Where(i => i.Plan.MasterPlanId != planMaster.Id && i.Status != ApprovalStatus.Pending);
                list = all.Where(i => i.Plan.MasterPlanId != planMaster.Id && i.Status != ApprovalStatus.Pending).ToList();

            }
            bool flag = list.Any();

            if (!flag)
            {
                return new APIsResponseFilterDto<GetAllPlanDirectionDto>
                {
                    Data = new List<GetAllPlanDirectionDto>(),
                    Metadata = new MetaDataDto
                    {
                        CurrentPage = page,
                        PerPage = perPage,
                        LastPage = 0,
                        Total = 0,
                        From = 0,
                        To = 0
                    }
                };
            }
            int totalCount = all.Count();
            int lastPage = (int)Math.Ceiling((double)totalCount / perPage);
            int from = totalCount == 0 ? 0 : ((page - 1) * perPage) + 1;

            int to = Math.Min(page * perPage, totalCount);


            var paginatedData = all
     .OrderBy(i => i.Id)
     .Skip((page - 1) * perPage)
     .Take(perPage)

                 .Select(i => new GetAllPlanDirectionDto
                 {
                     Id = i.Id,
                     Name = i.Units.Name,
                     username = i.User.UserName,
                     date = i.CreatedAt.ToString(),


                     // Map other properties as needed
                 })
                .ToList();

            return new APIsResponseFilterDto<GetAllPlanDirectionDto>
            {
                Data = paginatedData,
                Metadata = new MetaDataDto
                {
                    CurrentPage = page,
                    PerPage = perPage,
                    LastPage = lastPage,
                    Total = totalCount,
                    From = from,
                    To = to
                }
            };

        }
        private async Task<APIsResponseFilterDto<GetAllPlanDirectionDto>> GetAllForHighAsync([FromQuery] string? Filter, [FromQuery] int perPage = 5, [FromQuery] int page = 0)
        {
            var all = _context.PlanDirection
           .AsQueryable();
            var list = new List<PlanDirection>();
            var planMaster = await _unitOfWork.PlanMaster.GetLastMasterPlan();

            if (string.Equals(Filter, "Current", StringComparison.OrdinalIgnoreCase))
            {
                all = all.Where(i => i.Plan.MasterPlanId == planMaster.Id && i.Status == ApprovalStatus.ApprovedByRegionManager || i.Status == ApprovalStatus.ApprovedByHighManagement || i.Status == ApprovalStatus.ReturnedByHighManagement || i.Status == ApprovalStatus.RejectedByHighManagement);
                list = all.Where(i => i.Plan.MasterPlanId == planMaster.Id && i.Status == ApprovalStatus.ApprovedByRegionManager || i.Status == ApprovalStatus.ApprovedByHighManagement || i.Status == ApprovalStatus.ReturnedByHighManagement || i.Status == ApprovalStatus.RejectedByHighManagement).ToList();
            }
            else if (string.Equals(Filter, "Archived", StringComparison.OrdinalIgnoreCase))
            {
                all = all.Where(i => i.Plan.MasterPlanId != planMaster.Id && i.Status == ApprovalStatus.ApprovedByRegionManager || i.Status == ApprovalStatus.ApprovedByHighManagement || i.Status == ApprovalStatus.ReturnedByHighManagement || i.Status == ApprovalStatus.RejectedByHighManagement);
                list = all.Where(i => i.Plan.MasterPlanId != planMaster.Id && i.Status == ApprovalStatus.ApprovedByRegionManager || i.Status == ApprovalStatus.ApprovedByHighManagement || i.Status == ApprovalStatus.ReturnedByHighManagement || i.Status == ApprovalStatus.RejectedByHighManagement).ToList();
            }
            bool flag = list.Any();

            if (!flag)
            {
                return new APIsResponseFilterDto<GetAllPlanDirectionDto>
                {
                    Data = new List<GetAllPlanDirectionDto>(),
                    Metadata = new MetaDataDto
                    {
                        CurrentPage = page,
                        PerPage = perPage,
                        LastPage = 0,
                        Total = 0,
                        From = 0,
                        To = 0
                    }
                };
            }
            int totalCount = all.Count();
            int lastPage = (int)Math.Ceiling((double)totalCount / perPage);
            int from = totalCount == 0 ? 0 : ((page - 1) * perPage) + 1;

            int to = Math.Min(page * perPage, totalCount);


            var paginatedData = all
     .OrderBy(i => i.Id)
     .Skip((page - 1) * perPage)
     .Take(perPage)

                 .Select(i => new GetAllPlanDirectionDto
                 {
                     Id = i.Id,
                     Name = i.Units.Name,
                     username = i.User.UserName,
                     date = i.CreatedAt.ToString(),


                     // Map other properties as needed
                 })
                .ToList();

            return new APIsResponseFilterDto<GetAllPlanDirectionDto>
            {
                Data = paginatedData,
                Metadata = new MetaDataDto
                {
                    CurrentPage = page,
                    PerPage = perPage,
                    LastPage = lastPage,
                    Total = totalCount,
                    From = from,
                    To = to
                }
            };

        }
    }
}
