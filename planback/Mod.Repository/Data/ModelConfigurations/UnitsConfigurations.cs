namespace Mod.Repository.Data.ModelConfigurations
{
    public class UnitsConfigurations : IEntityTypeConfiguration<Units>
    {
        public void Configure(EntityTypeBuilder<Units> builder)
        {
            builder.
       HasMany(u => u.Users)
       .WithOne(e => e.Units)
       .HasForeignKey(i => i.UnitId).OnDelete(DeleteBehavior.Cascade); 

            builder.HasOne(r=>r.Regions).WithMany(u=>u.Units).HasForeignKey(i=>i.RegionId).OnDelete(DeleteBehavior.Cascade);
                
        }
    }
}
