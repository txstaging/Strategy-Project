namespace Mod.Repository.Data.ModelConfigurations
{
    public class PlanConfiguration : IEntityTypeConfiguration<Plans>
    {
        public void Configure(EntityTypeBuilder<Plans> builder)
        {
            builder.ToTable("Plans");

            builder.HasKey(p => p.Id);

            // العلاقة مع Units
            builder.HasOne(p => p.Units)
                   .WithMany()
                   .HasForeignKey(p => p.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);

            // العلاقة مع PlanMaster
            builder.HasOne(p => p.PlanMaster)
                   .WithMany()
                   .HasForeignKey(p => p.MasterPlanId)
                   .OnDelete(DeleteBehavior.Restrict);

            // العلاقة مع PlanAnalysis
            builder.HasOne(p => p.PlanAnalysis)
                   .WithOne(i=>i.Plan)
                   .HasForeignKey<Plans>(i=>i.PlanAnalysisId)
                   .OnDelete(DeleteBehavior.Restrict);

            // العلاقة مع PlanDirection (One-to-One)
            builder.HasOne(p => p.PlanDirection)
                   .WithOne(pd => pd.Plan) // يجب تعريف العلاقة العكسية في PlanDirection
                   .HasForeignKey<Plans>(p => p.PlanDirectionId)
                   .OnDelete(DeleteBehavior.Cascade);
           
            builder.HasOne(p => p.PlanGoalsStep)
                 .WithOne(i => i.Plan)
                 .HasForeignKey<Plans>(i => i.PlanGoalsStepId)
                 .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(p => p.PlanInitiativeStep)
                .WithOne(i => i.Plan)
                .HasForeignKey<Plans>(i => i.planInitiativeStepId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(p => p.PlanProjectsStep)
               .WithOne(i => i.Plan)
               .HasForeignKey<Plans>(i => i.planProjectsStepId)
               .OnDelete(DeleteBehavior.Restrict);




            builder.Property(e => e.CurrentStage)
                            .HasConversion<string>();

        }
    }
}
