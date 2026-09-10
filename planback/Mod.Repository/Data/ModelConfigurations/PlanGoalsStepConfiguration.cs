using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mod.Repository.Data.ModelConfigurations
{
    public class PlanGoalsStepConfiguration : IEntityTypeConfiguration<PlanGoalsStep>
    {
        public void Configure(EntityTypeBuilder<PlanGoalsStep> builder)
        {
            builder.HasKey(pd => pd.Id);

            // Relationships
            builder.HasOne(pd => pd.Units)
                   .WithMany()
                   .HasForeignKey(pd => pd.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pd => pd.Plan)
                   .WithOne(i => i.PlanGoalsStep)
                   .HasForeignKey<PlanGoalsStep>(pd => pd.PlanId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pd => pd.User)
                   .WithMany()
                   .HasForeignKey(pd => pd.AppUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(p => p.Goals)
                .WithOne(p => p.planGoalsStep)
                .HasForeignKey(p => p.planGoalsStepId);

            builder.Property(e => e.Status)
                             .HasConversion<string>();

        }
    }
}
