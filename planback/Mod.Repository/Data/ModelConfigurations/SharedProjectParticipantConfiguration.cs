using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mod.Repository.Data.ModelConfigurations
{
    public class SharedProjectParticipantConfiguration : IEntityTypeConfiguration<SharedProjectParticipant>
    {
        public void Configure(EntityTypeBuilder<SharedProjectParticipant> builder)
        {
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Contribution).IsRequired();
            builder.Property(p => p.Amount).HasPrecision(18, 2);

            builder.HasOne(p => p.Project)
                   .WithMany()
                   .HasForeignKey(p => p.ProjectId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(p => p.Unit)
                   .WithMany()
                   .HasForeignKey(p => p.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(p => p.CreatedByUser)
                   .WithMany()
                   .HasForeignKey(p => p.CreatedByUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(p => p.ProjectId);
            builder.HasIndex(p => p.UnitId);
        }
    }
}
