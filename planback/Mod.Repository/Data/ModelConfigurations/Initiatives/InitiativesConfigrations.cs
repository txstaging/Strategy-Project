using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mod.Core.Entities.Initiative;

namespace Mod.Repository.Data.ModelConfigurations.Initiatives
{
    public class InitiativesConfigrations : IEntityTypeConfiguration<PlanInitiative>
    {
        public void Configure(EntityTypeBuilder<PlanInitiative> builder)
        {
            builder.HasKey(pd => pd.Id);

            builder.Property(pd => pd.Comment)
                .IsRequired(false)
                .HasMaxLength(500);

            builder.Property(p => p.Status)
                .HasConversion<string>();

            #region Relationships
            builder.HasMany(p => p.InitiativeKpis)
               .WithOne(k => k.Initiative)
               .HasForeignKey(k => k.InitiativeId)
               .OnDelete(DeleteBehavior.Cascade);
           

            builder.HasOne(pd => pd.Unit)
                   .WithMany()
                   .HasForeignKey(pd => pd.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);
            builder.HasOne(a => a.PlanInitiativeStep)
             .WithMany(pa => pa.Initiative)
             .HasForeignKey(a => a.PlanInitiativeStepId)
             .OnDelete(DeleteBehavior.Cascade);



            builder.HasOne(pd => pd.User)
                   .WithMany()
                   .HasForeignKey(pd => pd.AppUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder
                .HasOne(p => p.Goal)
                .WithMany(i => i.PlanInitiatives)
                .HasForeignKey(i => i.GoalId)
                .OnDelete(DeleteBehavior.Cascade);

           
            #endregion 
        }
    }
    public class InitiativesItemsConfigrations : IEntityTypeConfiguration<InitiativeItem>
    {
        public void Configure(EntityTypeBuilder<InitiativeItem> builder)
        {

            builder.HasKey(pd => pd.Id);

            builder.Property(pd => pd.Comment)
                .IsRequired(false)
                .HasMaxLength(500);

            builder.Property(p => p.Status)
                .HasConversion<string>();
        }
    }
    public class InitiativesKPIsConfigrations : IEntityTypeConfiguration<InitiativeKpi>
    {
        public void Configure(EntityTypeBuilder<InitiativeKpi> builder)
        {
            builder.HasKey(pd => pd.Id);

            builder.Property(pd => pd.Comment)
                .IsRequired(false)
                .HasMaxLength(500);

            builder.Property(p => p.Status)
                .HasConversion<string>();
        }
    }
    public class PlanInitiativeStepConfigrations : IEntityTypeConfiguration<PlanInitiativeStep>
    {
        public void Configure(EntityTypeBuilder<PlanInitiativeStep> builder)
        {
            builder.HasKey(pd => pd.Id);

            // Relationships
            builder.HasOne(pd => pd.Units)
                   .WithMany()
                   .HasForeignKey(pd => pd.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pd => pd.Plan)
                   .WithOne(i => i.PlanInitiativeStep)
                   .HasForeignKey<PlanInitiativeStep>(pd => pd.PlanId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pd => pd.User)
                   .WithMany()
                   .HasForeignKey(pd => pd.AppUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(p => p.Initiative)
                .WithOne(p => p.PlanInitiativeStep)
                .HasForeignKey(p => p.PlanInitiativeStepId);

            builder.Property(e => e.Status)
                             .HasConversion<string>();
        }
    }
}
