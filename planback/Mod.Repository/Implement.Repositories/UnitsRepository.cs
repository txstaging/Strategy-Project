namespace Mod.Repository.Implement.Repositories
{
    public class UnitsRepository : IUnitRepository
	{
		private readonly ModContext _context;

		public UnitsRepository(ModContext context)
		{
			_context = context;
		}
        public async Task Add(Units unit)
        {
            _context.Units.Add(unit);


        }

        public async Task<IEnumerable<Units>> GetAll()
		{
			return await _context.Units.ToListAsync();
		}

		public async Task<IEnumerable<Units>> GetUserUnits(AppUser user)
		{
			if (
				user.Role == RoleEnum.Admin.ToString()
				|| user.Role == RoleEnum.HighManagement.ToString()
			)
			{
				return await _context.Units.ToListAsync();
			}
			else if (
				user.Role == RoleEnum.UnitEmployee.ToString()
				|| user.Role == RoleEnum.UnitManager.ToString()
			)
			{
				return await _context.Units
					.Where(u => u.Id == user.UnitId)
					.ToListAsync();
			}
			else if (
				user.Role == RoleEnum.RegionManager.ToString()
			)
			{
				// get the region of the user unit
				var regionId = await _context.Units
					.Where(u => u.Id == user.UnitId)
					.Select(u => u.RegionId)
					.FirstOrDefaultAsync();

				var regionUnitIds = await _context.Units
					.Where(u => u.RegionId == regionId)
					.Select(u => u.Id)
					.ToListAsync();

				return await _context.Units
					.Where(u => regionUnitIds.Contains(u.Id))
					.ToListAsync();
			}
			else
			{
				throw new Exception("User role not found");
			}
		}

		public async Task<Units> GetById(int id)
		{
			return await _context.Units.FindAsync(id);
		}
	}
}
