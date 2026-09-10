namespace Mod.Repository.Data.ModelConfigurations
{
    public class AnalysisPointsConfiguration : IEntityTypeConfiguration<AnalysisPoints>
    {
        public void Configure(EntityTypeBuilder<AnalysisPoints> builder)
        {
            builder.HasKey(e => e.Id); 

            builder.Property(e => e.Procedures)
                  .IsRequired()
                  .HasMaxLength(1000);

            builder.Property(e => e.Name)
                  .IsRequired()
                  .HasMaxLength(255);

            builder.Property(e => e.Impact)
                  .IsRequired();

            builder.Property(e => e.DegreeOfCertainty)
                  .IsRequired();

            builder.Property(e => e.Priority)
                  .IsRequired(false);

            builder.Property(e => e.Comment)
                  .IsRequired(false)
                  .HasMaxLength(500);

            
            builder.Property(e => e.Status)
                  .HasConversion<string>()
                  .IsRequired();

            builder.Property(e => e.Type)
                  .HasConversion<string>()
                  .IsRequired();
            builder.HasOne(a => a.PlanAnalysis)
               .WithMany(pa => pa.AnalysisPoints)
               .HasForeignKey(a => a.AnalysisId)
               .OnDelete(DeleteBehavior.Cascade);


          






        }
    }
}
