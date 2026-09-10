using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mod.Repository.Data.ModelConfigurations
{
    public class PlanProjectsConfiguration : IEntityTypeConfiguration<PlanProjects>
    {
        public void Configure(EntityTypeBuilder<PlanProjects> builder)
        {
            builder.HasKey(pd => pd.Id);

            // Relationships
            builder.HasOne(pd => pd.Units)
                   .WithMany()
                   .HasForeignKey(pd => pd.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.planProjectsStep)
             .WithMany(pa => pa.Projects)
             .HasForeignKey(a => a.planProjectsStepId)
             .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pg => pg.Initiative)
               .WithMany(p => p.PlanProjects)
               .HasForeignKey(pg => pg.PlanInitiativeId)
               .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pg => pg.Goals)
              .WithMany(p => p.PlanProjects)
              .HasForeignKey(pg => pg.PlanGoalsId)
              .OnDelete(DeleteBehavior.Cascade);

            builder.Property(e => e.Status)
                             .HasConversion<string>();

            builder.HasOne(pd => pd.Name)
                  .WithOne()
                  .HasForeignKey<PlanProjects>(di => di.NameId)
                  .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pd => pd.Beneficiaries)
                 .WithOne()
                 .HasForeignKey<PlanProjects>(di => di.BeneficiariesId)
                 .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pd => pd.Duration)
                 .WithOne()
                 .HasForeignKey<PlanProjects>(di => di.DurationId)
                 .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pd => pd.SupervisingAuthority)
                .WithOne()
                .HasForeignKey<PlanProjects>(di => di.SupervisingAuthorityId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pd => pd.Priority)
                .WithOne()
                .HasForeignKey<PlanProjects>(di => di.PriorityId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
    public class PlanProjectsStepConfiguration : IEntityTypeConfiguration<PlanProjectsStep>
    {
        public void Configure(EntityTypeBuilder<PlanProjectsStep> builder)
        {
            builder.HasKey(pd => pd.Id);

            // Relationships
            builder.HasOne(pd => pd.Units)
                   .WithMany()
                   .HasForeignKey(pd => pd.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pd => pd.Plan)
                   .WithOne(i => i.PlanProjectsStep)
                   .HasForeignKey<PlanProjectsStep>(pd => pd.PlanId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pd => pd.User)
                   .WithMany()
                   .HasForeignKey(pd => pd.AppUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(p => p.Projects)
                .WithOne(p => p.planProjectsStep)
                .HasForeignKey(p => p.planProjectsStepId);

            builder.Property(e => e.Status)
                             .HasConversion<string>();
        }
    }
}
