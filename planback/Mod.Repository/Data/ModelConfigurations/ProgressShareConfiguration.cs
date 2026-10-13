using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mod.Repository.Data.ModelConfigurations
{
    public class ProgressShareConfiguration : IEntityTypeConfiguration<ProgressShare>
    {
        public void Configure(EntityTypeBuilder<ProgressShare> builder)
        {
            builder.HasKey(p => p.Id);
            builder.Property(p => p.ScopeName).IsRequired();

            builder.HasOne(p => p.SentByUser)
                   .WithMany()
                   .HasForeignKey(p => p.SentByUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(p => p.Recipients)
                   .WithOne(r => r.ProgressShare)
                   .HasForeignKey(r => r.ProgressShareId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class ProgressShareRecipientConfiguration : IEntityTypeConfiguration<ProgressShareRecipient>
    {
        public void Configure(EntityTypeBuilder<ProgressShareRecipient> builder)
        {
            builder.HasKey(r => r.Id);

            builder.HasOne(r => r.User)
                   .WithMany()
                   .HasForeignKey(r => r.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            // The inbox query filters on this.
            builder.HasIndex(r => r.UserId);
        }
    }
}
