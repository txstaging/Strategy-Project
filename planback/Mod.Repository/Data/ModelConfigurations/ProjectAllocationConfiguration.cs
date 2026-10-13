using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mod.Repository.Data.ModelConfigurations
{
    public class ProjectAllocationConfiguration : IEntityTypeConfiguration<ProjectAllocation>
    {
        public void Configure(EntityTypeBuilder<ProjectAllocation> builder)
        {
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Name).IsRequired();
            builder.Property(a => a.Amount).HasPrecision(18, 2);

            builder.HasOne(a => a.Project)
                   .WithMany()
                   .HasForeignKey(a => a.ProjectId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(a => a.CreatedByUser)
                   .WithMany()
                   .HasForeignKey(a => a.CreatedByUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            // The screen always reads allocations per project.
            builder.HasIndex(a => a.ProjectId);
        }
    }
}
