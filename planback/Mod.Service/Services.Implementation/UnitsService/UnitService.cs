namespace Mod.Service.Services.Implementation.UnitsService
{
    public class UnitService : IUnitsService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UnitService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<APIsGenralResponseDto<string>> Add(string UnitName)
        {
            var unit = await _unitOfWork.Unit.GetAll();
            if (unit.Any(x => x.Name == UnitName)) return new APIsGenralResponseDto<string>("Unit Name Already Exist", null);
            var newUnit = new Units
            {
                Name = UnitName,
                RegionId = 1

            };
            await _unitOfWork.Unit.Add(newUnit);
            await _unitOfWork.SaveChangesAsync();
            return new APIsGenralResponseDto<string>("Unit Added Successfully", null);


        }

        public Task<APIsGenralResponseDto<GetAllUnitDto>> GetAll()
        {
            throw new NotImplementedException();
        }

        public Task<Units> GetById(int id)
        {
            throw new NotImplementedException();
        }

    }
}
