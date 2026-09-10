using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mod.Repository.Data.ModelConfigurations
{
    public class PlanGoalsConfiguration : IEntityTypeConfiguration<PlanGoals>
    {
        public void Configure(EntityTypeBuilder<PlanGoals> builder)
        {
            builder.HasKey(pd => pd.Id);

            // Relationships
            builder.HasOne(pd => pd.Units)
                   .WithMany()
                   .HasForeignKey(pd => pd.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);
           
            builder.HasMany(p => p.PlanInitiatives)
              .WithOne(pg => pg.Goal)
              .HasForeignKey(pg => pg.GoalId)
              .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(a => a.planGoalsStep)
              .WithMany(pa => pa.Goals)
              .HasForeignKey(a => a.planGoalsStepId)
              .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(p => p.PlanProjects)
             .WithOne(pg => pg.Goals)
             .HasForeignKey(pg => pg.PlanGoalsId)
             .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pd => pd.User)
                   .WithMany()
                   .HasForeignKey(pd => pd.AppUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(pd => pd.Name)
                   .WithOne()
                   .HasForeignKey<PlanGoals>(di => di.NameId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pd => pd.Indicator)
                 .WithOne()
                 .HasForeignKey<PlanGoals>(di => di.IndicatorId)
                 .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(pd => pd.Descripition)
                  .WithOne()
                  .HasForeignKey<PlanGoals>(di => di.DescripitionId)
                  .OnDelete(DeleteBehavior.Cascade);

            builder.Property(e => e.Status)
                             .HasConversion<string>();
        }
    }
}
