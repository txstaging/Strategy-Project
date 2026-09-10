namespace Mod.Repository.Data.ModelConfigurations
{
    public class RegionsConfiguration : IEntityTypeConfiguration<Regions>
    {
        public void Configure(EntityTypeBuilder<Regions> builder)
        {
            builder.HasKey(e => e.Id); 

            builder.Property(e => e.Name)
                  .IsRequired()
                  .HasMaxLength(255); 

            builder.HasMany(e => e.Units) 
                  .WithOne(u => u.Regions) 
                  .HasForeignKey(u => u.RegionId) 
                  .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
