using Mod.Core.Utils;
using Mod.Core;

namespace Mod.Service.Services.Implementation.AnalysisPointsService
{
    public class AnalysisPointsService : IAnalysisPointsService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly UserManager<AppUser> _userManager;
        private readonly ICurrentUserService currentUser;
        private readonly ModContext context;

        public AnalysisPointsService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<AppUser> userManager,ICurrentUserService currentUser,ModContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userManager = userManager;
            this.currentUser = currentUser;
            this.context = context;
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Add(AddAnalysisPointsDto point, AppUser user,int PlanID)
        {
            
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();

            
            switch (userRole)
            {
                case var role when role == RoleEnum.UnitEmployee.ToString():
                    return await AddByUnitEmployee(point,PlanID);

                case var role when role == RoleEnum.RegionManager.ToString():
                    return await AddByRegionManager(point,PlanID);

                case var role when role == RoleEnum.HighManagement.ToString():
                    return await AddByHighMangment(point,PlanID);

                case var role when role == RoleEnum.UnitManager.ToString():
                    return await AddByUnitEmployee(point, PlanID);

                default:
                    return new APIsGenralResponseDto<AddAnalysisPointsDto>("User role not authorized to add analysis points", point);
                    
            }
        }


        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> AddByHighMangment(AddAnalysisPointsDto point, int PlanID)
        {
            var Plan=await _unitOfWork.Plans.GetById(PlanID);
            var NewPoint = new AnalysisPoints()
            {
                CreatedAt = DateTime.UtcNow,
                Name = point.Name,
                DegreeOfCertainty = point.DegreeOfCertainty,
                Procedures = point.Procedures,
                Impact = point.Impact,
                Type = Enum.TryParse<AnalysisPointsType>(point.Type, true, out var result) ? result : throw new ArgumentException("Invalid Type value"),
                Priority = point.DegreeOfCertainty * point.Impact,
                Status = ApprovalStatus.ApprovedByHighManagement,
                PlanId = Plan.Id,
                AnalysisId = (int)Plan.PlanAnalysisId,
            };
            await _unitOfWork.AnalysisPoints.Add(NewPoint);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point added successfully", point);
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> AddByRegionManager(AddAnalysisPointsDto point, int PlanID)
        {
            var Plan = await _unitOfWork.Plans.GetById(PlanID);
            var NewPoint = new AnalysisPoints()
            {
                CreatedAt = DateTime.UtcNow,
                Name = point.Name,
                DegreeOfCertainty = point.DegreeOfCertainty,
                Procedures = point.Procedures,
                Impact = point.Impact,
                Type = Enum.TryParse<AnalysisPointsType>(point.Type, true, out var result) ? result : throw new ArgumentException("Invalid Type value"),
                Priority = point.DegreeOfCertainty * point.Impact,
                Status = ApprovalStatus.ApprovedByRegionManager,
                PlanId = Plan.Id,
                AnalysisId = (int)Plan.PlanAnalysisId,
            };
            await _unitOfWork.AnalysisPoints.Add(NewPoint);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point added successfully", point);
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> AddByUnitEmployee(AddAnalysisPointsDto point, int PlanID)
        {
            var Plan = await _unitOfWork.Plans.GetById(PlanID);
            if(Plan.PlanAnalysisId is null)
            {
                
                var Analysis=new PlanAnalysis
                {
                    Plan=Plan,
                    PlanId=Plan.Id,
                    Status=ApprovalStatus.Pending,
                    Units=Plan.Units,
                    UnitId=Plan.UnitId

                };
                Plan.PlanAnalysis = Analysis;
               
                 _unitOfWork.Plans.Update(Plan);
                await _unitOfWork.SaveChangesAsync();

            }
            Plan = await _unitOfWork.Plans.GetById(PlanID);

            var NewPoint = new AnalysisPoints()
            {
                CreatedAt = DateTime.UtcNow,
                Name = point.Name,
                DegreeOfCertainty = point.DegreeOfCertainty,
                Procedures = point.Procedures,
                Impact=point.Impact,
                Type = Enum.TryParse<AnalysisPointsType>(point.Type, true, out var result) ? result : throw new ArgumentException("Invalid Type value"),
                Priority=point.DegreeOfCertainty*point.Impact,
                Status=ApprovalStatus.SavedAsDraft,
                PlanId=Plan.Id,
                AnalysisId=(int)Plan.PlanAnalysisId,
              
              

            };
            await _unitOfWork.AnalysisPoints.Add(NewPoint);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point added successfully", point);
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Approve(int PlanId, int PointId, AppUser user)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
            var Point = await _unitOfWork.AnalysisPoints.GetById(PointId);
            



            Point.Status = Utils.GetApprovalStatus(ActionEnum.Approve, Enum.Parse<RoleEnum>(user!.Role!));
            _unitOfWork.AnalysisPoints.Update(Point);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point Approve successfully", _mapper.Map<AddAnalysisPointsDto>(Point));
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ApproveByHighMangment(int PlanId, int PointId)
        {
            var Point = await _unitOfWork.AnalysisPoints.GetById(PointId);
            if(Point.PlanId==PlanId)
            {
                if(!string.IsNullOrEmpty(Point.Comment))
                {
                    Point.Comment = "";
                }
                Point.Status=ApprovalStatus.ApprovedByHighManagementPartially;
                await _unitOfWork.AnalysisPoints.Update(Point);
                await _unitOfWork.SaveChangesAsync();

                return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point Approve successfully", _mapper.Map<AddAnalysisPointsDto>(Point));

            }
            
                return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point not Approve successfully", _mapper.Map<AddAnalysisPointsDto>(Point));
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ApproveByRegionManager(int PlanId, int PointId)
        {
            var Point = await _unitOfWork.AnalysisPoints.GetById(PointId);
            if (Point.PlanId == PlanId)
            {
                if (!string.IsNullOrEmpty(Point.Comment))
                {
                    Point.Comment = "";
                }
                Point.Status = ApprovalStatus.ApprovedByRegionManagerPartially;
                await _unitOfWork.AnalysisPoints.Update(Point);
                await _unitOfWork.SaveChangesAsync();

                return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point Approve successfully", _mapper.Map<AddAnalysisPointsDto>(Point));

            }

            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point not Approve successfully", _mapper.Map<AddAnalysisPointsDto>(Point));
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Delete(int id, int PlanID)
        {
            var analysisPoint = await _unitOfWork.AnalysisPoints.GetById(id);
            // The null check has to come before the mapping, otherwise a missing id
            // throws inside AutoMapper and never reaches the "Record not found" branch.
            if (analysisPoint == null)
            {
                return new APIsGenralResponseDto<AddAnalysisPointsDto>("Record not found", null);
            }

            // Enforced server-side as well as in the UI, so it cannot be bypassed by
            // calling the API directly.
            if (!Utils.IsDeletable(analysisPoint.Status))
            {
                return new APIsGenralResponseDto<AddAnalysisPointsDto>("لا يمكن حذف عنصر تمت الموافقة عليه", null);
            }

            var analysisPointAfterMap = _mapper.Map<AddAnalysisPointsDto>(analysisPoint);
            await _unitOfWork.AnalysisPoints.Delete(id);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Deleted successfully", _mapper.Map<AddAnalysisPointsDto>(analysisPointAfterMap));
        }

        public async Task<APIsResponseFilterDto<AddAnalysisPointsDto>> GetAll(int PlanId, int Page, int PerPage, string? Type, AppUser user)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
            


            switch (userRole)
            {
                case var role when role == RoleEnum.RegionManager.ToString():
                    return await GetAllForRegionManager(PlanId,Page,PerPage,Type);

                case var role when role == RoleEnum.HighManagement.ToString():
                    return await GetAllForHighMangment(PlanId, Page, PerPage, Type);

                case var role when role == RoleEnum.UnitEmployee.ToString():
                    return await GetAllForUnit(PlanId, Page, PerPage, Type);


                case var role when role == RoleEnum.UnitManager.ToString():
                    return await GetAllForUnit(PlanId, Page, PerPage, Type);


                default:
                    return new APIsResponseFilterDto<AddAnalysisPointsDto>
                    {
                        Data = new List<AddAnalysisPointsDto>(),
                        Metadata = new MetaDataDto()
                    };




            }
        }

        public async Task<APIsResponseFilterDto<AddAnalysisPointsDto>> GetAllForHighMangment(int PlanId, int Page, int PerPage, string? Type)
        {


            var allPoints = await _unitOfWork.AnalysisPoints.GetAll();


            var filteredPoints = allPoints
                .Where(i => i.PlanId == PlanId);

            filteredPoints = filteredPoints.Where(i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially && i.Status! != ApprovalStatus.ReturnedByUnitManager && i.Status != ApprovalStatus.RejectedByUnitManager);
            //.Where(
            //	 (
            //		p.Status==ApprovalStatus.ApprovedByRegionManager ||
            //		p.Status ==ApprovalStatus.ApprovedByHighManagement ||
            //		p.Status ==ApprovalStatus.RejectedByHighManagement ||
            //		p.Status ==ApprovalStatus.ReturnedByHighManagement
            //	)



            if (!string.IsNullOrEmpty(Type))
            {
                filteredPoints = filteredPoints.Where(p => p.Type.ToString().Equals(Type, StringComparison.OrdinalIgnoreCase));
            }


            var totalCount = filteredPoints.Count();
            var finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(filteredPoints);

            if (Page==0)
            {
               finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(filteredPoints);


            }
            else
            {
                var paginatedPoints = filteredPoints
              .Skip((Page - 1) * PerPage)
              .Take(PerPage)
              .ToList();
                finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(paginatedPoints);

            }
          





            var metadata = new MetaDataDto
            {
                CurrentPage = Page,
                PerPage = PerPage,
                Total = totalCount,
                From = (Page - 1) * PerPage + 1,
                To = Math.Min(Page * PerPage, totalCount),
                LastPage = (int)Math.Ceiling(totalCount / (double)PerPage)
            };


            return new APIsResponseFilterDto<AddAnalysisPointsDto>
            {
                Data = finalList.ToList(),
                Metadata = metadata
            };



           
        }


        public async Task<APIsResponseFilterDto<AddAnalysisPointsDto>> GetAllForRegionManager(int PlanId, int Page, int PerPage, string? Type)
        {
            var allPoints = await _unitOfWork.AnalysisPoints.GetAll();


            var filteredPoints = allPoints.Where(p => p.PlanId == PlanId/*&&p.Status==ApprovalStatus.ApprovedByUnitManager||p.Status==ApprovalStatus.ReturnedByRegionManager||p.Status==ApprovalStatus.RejectedByRegionManager||p.Status==ApprovalStatus.ApprovedByRegionManager*/);
            filteredPoints = filteredPoints.Where(p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially);

            var finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(filteredPoints);
            if (!string.IsNullOrEmpty(Type))
            {
                filteredPoints = filteredPoints.Where(p => p.Type.ToString().Equals(Type, StringComparison.OrdinalIgnoreCase));
            }
            if (Page == 0)
            {
                finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(filteredPoints);


            }
            else
            {
                var paginatedPoints = filteredPoints
               .Skip((Page - 1) * PerPage)
               .Take(PerPage)
               .ToList();
                finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(paginatedPoints);

            }
            var totalCount = filteredPoints.Count();


           


            //var dtoList = paginatedPoints.Select(p => new AddAnalysisPointsDto
            //{
            //    Name = p.Name,
            //    Procedures = p.Procedures,
            //    Impact = p.Impact,
            //    DegreeOfCertainty = p.DegreeOfCertainty,
            //    Priority = p.Priority,
            //    Comment = p.Comment,
            //    Status = p.Status,
            //    Type = p.Type.ToString()
            //}).ToList();


            var metadata = new MetaDataDto
            {
                CurrentPage = Page,
                PerPage = PerPage,
                Total = totalCount,
                From = (Page - 1) * PerPage + 1,
                To = Math.Min(Page * PerPage, totalCount),
                LastPage = (int)Math.Ceiling(totalCount / (double)PerPage)
            };


            return new APIsResponseFilterDto<AddAnalysisPointsDto>
            {
                Data = finalList.ToList(),
                Metadata = metadata
            };
        }

        public async Task<APIsResponseFilterDto<AddAnalysisPointsDto>> GetAllForUnit(int PlanId, int Page, int PerPage, string? Type)
        {
            var allPoints = await _unitOfWork.AnalysisPoints.GetAll();


            var filteredPoints = allPoints.Where(p => p.PlanId == PlanId);
            var currentUserr = await currentUser.GetCurrentUserAsync();
            if(currentUserr.Role == RoleEnum.UnitManager.ToString())
            {
                filteredPoints = filteredPoints.Where(p => p.Status !=ApprovalStatus.SavedAsDraft);
            }
            var finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(filteredPoints);

            if (!string.IsNullOrEmpty(Type))
            {
                filteredPoints = filteredPoints.Where(p => p.Type.ToString().Equals(Type, StringComparison.OrdinalIgnoreCase));
            }
            
            if (Page == 0)
            {
                finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(filteredPoints);


            }
            else
            {
                var paginatedPoints = filteredPoints
               .Skip((Page - 1) * PerPage)
               .Take(PerPage)
               .ToList();
                finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(paginatedPoints);

            }

            var totalCount = filteredPoints.Count();


           


            //var dtoList = paginatedPoints.Select(p => new AddAnalysisPointsDto
            //{
            //    Name = p.Name,
            //    Procedures = p.Procedures,
            //    Impact = p.Impact,
            //    DegreeOfCertainty = p.DegreeOfCertainty,
            //    Priority = p.Priority,
            //    Comment = p.Comment,
            //    Status = p.Status,
            //    Type = p.Type.ToString()
            //}).ToList();


            var metadata = new MetaDataDto
            {
                CurrentPage = Page,
                PerPage = PerPage,
                Total = totalCount,
                From = (Page - 1) * PerPage + 1,
                To = Math.Min(Page * PerPage, totalCount),
                LastPage = (int)Math.Ceiling(totalCount / (double)PerPage)
            };


            return new APIsResponseFilterDto<AddAnalysisPointsDto>
            {
                Data = finalList.ToList(),
                Metadata = metadata
            };
        }
        public async Task<GetAllPoints> GetAllV2(int PlanId,  AppUser user)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();



            switch (userRole)
            {
                case var role when role == RoleEnum.RegionManager.ToString():
                    return await GetAllForRegionManagerV2(PlanId);

                case var role when role == RoleEnum.HighManagement.ToString():
                    return await GetAllForHighMangmentV2(PlanId);

                case var role when role == RoleEnum.UnitEmployee.ToString():
                    return await GetAllForUnitV2(PlanId);


                case var role when role == RoleEnum.UnitManager.ToString():
                    return await GetAllForUnitV2(PlanId);


                default:
                    return new GetAllPoints
                    {
                       
                    };




            }
        }

        public async Task<GetAllPoints> GetAllForHighMangmentV2(int PlanId)
        {


            var allPoints = await _unitOfWork.AnalysisPoints.GetAll();


            var filteredPoints = allPoints
                .Where(i => i.PlanId == PlanId);

            filteredPoints = filteredPoints.Where(i => i.Status != ApprovalStatus.Pending && i.Status != ApprovalStatus.RejectedByRegionManager && i.Status != ApprovalStatus.ReturnedByRegionManager && i.Status != ApprovalStatus.ApprovedByRegionManagerPartially && i.Status != ApprovalStatus.ApprovedByUnitManager && i.Status != ApprovalStatus.ApprovedByUnitManagerPartially&&i.Status!!=ApprovalStatus.ReturnedByUnitManager&&i.Status!=ApprovalStatus.RejectedByUnitManager);
            //.Where(
            //	 (
            //		p.Status==ApprovalStatus.ApprovedByRegionManager ||
            //		p.Status ==ApprovalStatus.ApprovedByHighManagement ||
            //		p.Status ==ApprovalStatus.RejectedByHighManagement ||
            //		p.Status ==ApprovalStatus.ReturnedByHighManagement
            //	)







            var finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(filteredPoints);

           






           


            return new GetAllPoints
            {
                Strenth=finalList.Where(i=>i.Type==AnalysisPointsType.Strength.ToString()).ToList(),
                Risks = finalList.Where(i => i.Type == AnalysisPointsType.Risk.ToString()).ToList(),
                Opportunities = finalList.Where(i => i.Type == AnalysisPointsType.Opportunity.ToString()).ToList(),
                Threats = finalList.Where(i => i.Type == AnalysisPointsType.Threat.ToString()).ToList(),

            };




        }


        public async Task<GetAllPoints> GetAllForRegionManagerV2(int PlanId)
        {
            var allPoints = await _unitOfWork.AnalysisPoints.GetAll();


            var filteredPoints = allPoints.Where(p => p.PlanId == PlanId/*&&p.Status==ApprovalStatus.ApprovedByUnitManager||p.Status==ApprovalStatus.ReturnedByRegionManager||p.Status==ApprovalStatus.RejectedByRegionManager||p.Status==ApprovalStatus.ApprovedByRegionManager*/);
            filteredPoints = filteredPoints.Where(p => p.Status == ApprovalStatus.ApprovedByUnitManager || p.Status == ApprovalStatus.ReturnedByRegionManager || p.Status == ApprovalStatus.RejectedByRegionManager || p.Status == ApprovalStatus.ApprovedByRegionManager || p.Status == ApprovalStatus.ApprovedByHighManagement || p.Status == ApprovalStatus.ApprovedByHighManagementPartially || p.Status == ApprovalStatus.ReturnedByHighManagement || p.Status == ApprovalStatus.RejectedByHighManagement || p.Status == ApprovalStatus.ApprovedByRegionManagerPartially);

            var finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(filteredPoints);






            //var dtoList = paginatedPoints.Select(p => new AddAnalysisPointsDto
            //{
            //    Name = p.Name,
            //    Procedures = p.Procedures,
            //    Impact = p.Impact,
            //    DegreeOfCertainty = p.DegreeOfCertainty,
            //    Priority = p.Priority,
            //    Comment = p.Comment,
            //    Status = p.Status,
            //    Type = p.Type.ToString()
            //}).ToList();





            return new GetAllPoints
            {
                Strenth = finalList.Where(i => i.Type == AnalysisPointsType.Strength.ToString()).ToList(),
                Risks = finalList.Where(i => i.Type == AnalysisPointsType.Risk.ToString()).ToList(),
                Opportunities = finalList.Where(i => i.Type == AnalysisPointsType.Opportunity.ToString()).ToList(),
                Threats = finalList.Where(i => i.Type == AnalysisPointsType.Threat.ToString()).ToList(),
            };
        }

        public async Task<GetAllPoints> GetAllForUnitV2(int PlanId)
        {
            var allPoints = await _unitOfWork.AnalysisPoints.GetAll();


            var filteredPoints = allPoints.Where(p => p.PlanId == PlanId);
            var finalList = _mapper.Map<IEnumerable<AnalysisPoints>, IEnumerable<AddAnalysisPointsDto>>(filteredPoints);




            return new GetAllPoints
            {
                Strenth = finalList.Where(i => i.Type == AnalysisPointsType.Strength.ToString()).ToList(),
                Risks = finalList.Where(i => i.Type == AnalysisPointsType.Risk.ToString()).ToList(),
                Opportunities = finalList.Where(i => i.Type == AnalysisPointsType.Opportunity.ToString()).ToList(),
                Threats = finalList.Where(i => i.Type == AnalysisPointsType.Threat.ToString()).ToList(),
            };
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> GetById(int id)
        {
            var point = await _unitOfWork.AnalysisPoints.GetById(id);
            var PointAfterMapping = _mapper.Map<AddAnalysisPointsDto>(point);
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Succses", PointAfterMapping);
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Reject(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment, AppUser user)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
            var Point = await _unitOfWork.AnalysisPoints.GetById(PointId);




            Point.Status = Utils.GetApprovalStatus(ActionEnum.Reject, Enum.Parse<RoleEnum>(user!.Role!));
            Point.Comment = Comment.Comment;
            _unitOfWork.AnalysisPoints.Update(Point);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point Reject successfully", _mapper.Map<AddAnalysisPointsDto>(Point));
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> RejectByHighMangment(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment)
        {
            var Point = await _unitOfWork.AnalysisPoints.GetById(PointId);
           
            if (Point.PlanId == PlanId)
            {
                Point.Status = ApprovalStatus.RejectedByHighManagement;

                Point.Comment = Comment.Comment;
                await _unitOfWork.AnalysisPoints.Update(Point);
                await _unitOfWork.SaveChangesAsync();

                return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point Rejected successfully", _mapper.Map<AddAnalysisPointsDto>(Point));

            }
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point not Rejected successfully", _mapper.Map<AddAnalysisPointsDto>(Point));

        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> RejectByRegionManager(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment)
        {
            var Point = await _unitOfWork.AnalysisPoints.GetById(PointId);
            if (Point.PlanId == PlanId)
            {
                Point.Status = ApprovalStatus.RejectedByRegionManager;
                Point.Comment = Comment.Comment;
                await _unitOfWork.AnalysisPoints.Update(Point);
                await _unitOfWork.SaveChangesAsync();

                return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point Rejected successfully", _mapper.Map<AddAnalysisPointsDto>(Point));

            }
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point not Rejected successfully", _mapper.Map<AddAnalysisPointsDto>(Point));
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ReturnToEdit(int PlanId, AppUser user, int PointId, ReturnAnalysisPointToEmployee Comment)
        {
            var userRole = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
            var Point = await _unitOfWork.AnalysisPoints.GetById(PointId);


           

            Point.Status = Utils.GetApprovalStatus(ActionEnum.Return, Enum.Parse<RoleEnum>(user!.Role!));
            Point.Comment = Comment.Comment;
            _unitOfWork.AnalysisPoints.Update(Point);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point Returned successfully", _mapper.Map<AddAnalysisPointsDto>(Point));
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ReturnToEditByHighMangment(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment)
        {
            var Point = await _unitOfWork.AnalysisPoints.GetById(PointId);
            var plan = await _unitOfWork.Plans.GetById(PlanId);
            plan.PlanAnalysis.Status = ApprovalStatus.Pending;
            _unitOfWork.Plans.Update(plan);
            if (Point.PlanId == PlanId)
            {
                Point.Status = ApprovalStatus.ReturnedByHighManagement;
                Point.Comment = Comment.Comment;
                await _unitOfWork.AnalysisPoints.Update(Point);
                await _unitOfWork.SaveChangesAsync();

                return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point Returned successfully", _mapper.Map<AddAnalysisPointsDto>(Point));

            }
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point not Returned successfully", _mapper.Map<AddAnalysisPointsDto>(Point));
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> ReturnToEditByRegionManager(int PlanId, int PointId, ReturnAnalysisPointToEmployee Comment)
        {
            var Point = await _unitOfWork.AnalysisPoints.GetById(PointId);
            var plan = await _unitOfWork.Plans.GetById(PlanId);
            plan.PlanAnalysis.Status = ApprovalStatus.Pending;
            _unitOfWork.Plans.Update(plan);
            if (Point.PlanId == PlanId)
            {
                Point.Status = ApprovalStatus.ReturnedByRegionManager;
                Point.Comment = Comment.Comment;
                await _unitOfWork.AnalysisPoints.Update(Point);
                await _unitOfWork.SaveChangesAsync();

                return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point Returned successfully", _mapper.Map<AddAnalysisPointsDto>(Point));

            }
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Point not Returned successfully", _mapper.Map<AddAnalysisPointsDto>(Point));
        }

        public async Task<APIsGenralResponseDto<AddAnalysisPointsDto>> Update(AddAnalysisPointsDto point, int PlanId, int Id)
        {
            var Point = await context.AnalysisPoints.FindAsync(Id);

            Point.Name = point.Name;
            Point.Procedures=point.Procedures;
            Point.DegreeOfCertainty=point.DegreeOfCertainty;
            Point.Priority=point.DegreeOfCertainty*point.Impact;
            
            Point.Comment=point.Comment;
            Point.Impact=point.Impact;
            Point.Type = Enum.TryParse<AnalysisPointsType>(point.Type, true, out var result) ? result : throw new ArgumentException("Invalid Type value");


            if (Point.Status == ApprovalStatus.ReturnedByHighManagement || Point.Status == ApprovalStatus.ReturnedByRegionManager || Point.Status == ApprovalStatus.ReturnedByUnitManager
                || Point.Status == ApprovalStatus.RejectedByHighManagement || Point.Status == ApprovalStatus.RejectedByRegionManager || Point.Status == ApprovalStatus.RejectedByUnitManager)
            {
                Point.Status = ApprovalStatus.Pending;

                // Editing a returned/rejected point restarts the approval cycle for
                // the whole analysis stage at the unit-manager level. Without this,
                // the stage stays "ApprovedByUnitManager", the unit manager's submit
                // button never reappears, and the re-approved point gets stuck as a
                // partially-approved item that higher managers can't see.
                var planAnalysis = await context.PlanAnalysis.FindAsync(Point.AnalysisId);
                if (planAnalysis != null)
                {
                    planAnalysis.Status = ApprovalStatus.Pending;
                    context.PlanAnalysis.Update(planAnalysis);
                }
            }

         context.AnalysisPoints.Update(Point);
           await context.SaveChangesAsync();
          
            return new APIsGenralResponseDto<AddAnalysisPointsDto>("Updated successfully", point);
        }
    }
   
}
