using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mod.Repository.Data.ModelConfigurations
{
    public class FeedbackRequestConfiguration : IEntityTypeConfiguration<FeedbackRequest>
    {
        public void Configure(EntityTypeBuilder<FeedbackRequest> builder)
        {
            builder.HasKey(f => f.Id);
            builder.Property(f => f.Message).IsRequired();

            builder.HasOne(f => f.RequestedByUser)
                   .WithMany()
                   .HasForeignKey(f => f.RequestedByUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(f => f.Plan)
                   .WithMany()
                   .HasForeignKey(f => f.PlanId)
                   .OnDelete(DeleteBehavior.Cascade);

            // Addressees and answers belong to the request and go with it.
            builder.HasMany(f => f.Recipients)
                   .WithOne(r => r.FeedbackRequest)
                   .HasForeignKey(r => r.FeedbackRequestId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(f => f.Responses)
                   .WithOne(r => r.FeedbackRequest)
                   .HasForeignKey(r => r.FeedbackRequestId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class FeedbackRequestRecipientConfiguration : IEntityTypeConfiguration<FeedbackRequestRecipient>
    {
        public void Configure(EntityTypeBuilder<FeedbackRequestRecipient> builder)
        {
            builder.HasKey(r => r.Id);

            builder.HasOne(r => r.Unit)
                   .WithMany()
                   .HasForeignKey(r => r.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(r => r.User)
                   .WithMany()
                   .HasForeignKey(r => r.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            // The inbox query filters on these, and a plan can accumulate many
            // requests over its life.
            builder.HasIndex(r => r.UnitId);
            builder.HasIndex(r => r.UserId);
        }
    }

    public class FeedbackResponseConfiguration : IEntityTypeConfiguration<FeedbackResponse>
    {
        public void Configure(EntityTypeBuilder<FeedbackResponse> builder)
        {
            builder.HasKey(r => r.Id);
            builder.Property(r => r.Message).IsRequired();

            builder.HasOne(r => r.RespondedByUser)
                   .WithMany()
                   .HasForeignKey(r => r.RespondedByUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(r => r.Unit)
                   .WithMany()
                   .HasForeignKey(r => r.UnitId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
