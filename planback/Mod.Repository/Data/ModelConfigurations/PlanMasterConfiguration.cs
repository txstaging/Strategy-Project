namespace Mod.Repository.Data.ModelConfigurations
{
    public class PlanMasterConfiguration : IEntityTypeConfiguration<PlanMaster>
    {
        public void Configure(EntityTypeBuilder<PlanMaster> builder)
        {
            builder.HasKey(e => e.Id);

            builder.Property(e => e.name)
                  .IsRequired()
                  .HasMaxLength(255);

            builder.HasMany(e => e.Plans)
                  .WithOne(p => p.PlanMaster)
                  .HasForeignKey(p => p.MasterPlanId)
                  .OnDelete(DeleteBehavior.Cascade); // Allow 

        }
    }
}
