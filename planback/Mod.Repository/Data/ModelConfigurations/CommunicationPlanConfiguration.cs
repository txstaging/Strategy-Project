using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mod.Repository.Data.ModelConfigurations
{
    public class CommunicationPlanEntryConfiguration : IEntityTypeConfiguration<CommunicationPlanEntry>
    {
        public void Configure(EntityTypeBuilder<CommunicationPlanEntry> builder)
        {
            builder.HasKey(e => e.Id);
            builder.Property(e => e.Channel).IsRequired();
            builder.Property(e => e.ResponsibleOfficer).IsRequired();
            builder.Property(e => e.ActionTaken).IsRequired();

            builder.HasOne(e => e.Plan)
                   .WithMany()
                   .HasForeignKey(e => e.PlanId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(e => e.CreatedByUser)
                   .WithMany()
                   .HasForeignKey(e => e.CreatedByUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(e => e.Unit)
                   .WithMany()
                   .HasForeignKey(e => e.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);

            // The sheet is always read per plan.
            builder.HasIndex(e => e.PlanId);
        }
    }
}
