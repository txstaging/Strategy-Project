namespace Mod.Repository.Data.ModelConfigurations
{
    public class PlanAnalysisConfiguration : IEntityTypeConfiguration<PlanAnalysis>
    {
        public void Configure(EntityTypeBuilder<PlanAnalysis> builder)
        {
            builder.HasKey(e => e.Id);


            builder.Property(e => e.Status)
                  .HasConversion<string>()
                  .IsRequired();

            builder.HasOne(e => e.Units)
                  .WithMany()
                  .HasForeignKey(e => e.UnitId)
                  .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(e => e.Plan)
       .WithOne(p => p.PlanAnalysis)
       .HasForeignKey<PlanAnalysis>(e => e.PlanId)
       .OnDelete(DeleteBehavior.Cascade);


            builder.HasMany(p => p.AnalysisPoints)
              .WithOne(a => a.PlanAnalysis)
              .HasForeignKey(a => a.AnalysisId)
              .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
