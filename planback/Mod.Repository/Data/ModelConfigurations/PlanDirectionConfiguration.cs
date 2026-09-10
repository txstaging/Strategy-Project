namespace Mod.Repository.Data.ModelConfigurations
{
    public class PlanDirectionConfiguration : IEntityTypeConfiguration<PlanDirection>
    {
        public void Configure(EntityTypeBuilder<PlanDirection> builder)
        {
            
            builder.ToTable("PlanDirections");

            // Primary Key
            builder.HasKey(pd => pd.Id);

            // Relationships
            builder.HasOne(pd => pd.Units)
                   .WithMany()
                   .HasForeignKey(pd => pd.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pd => pd.Plan)
                   .WithOne(i=>i.PlanDirection)
                   .HasForeignKey<PlanDirection>(pd => pd.PlanId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pd => pd.User)
                   .WithMany()
                   .HasForeignKey(pd => pd.AppUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(p => p.DirectionItems)
                .WithOne(p => p.PlanDirection)
                .HasForeignKey(p => p.PlanDirectionId);

            builder.Property(e => e.Status)
                             .HasConversion<string>();
                             
        }
    }
}
