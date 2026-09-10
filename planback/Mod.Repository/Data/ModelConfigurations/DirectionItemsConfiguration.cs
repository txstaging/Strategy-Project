namespace Mod.Repository.Data.ModelConfigurations
{
    public class DirectionItemsConfiguration : IEntityTypeConfiguration<DirectionItems>
    {
        public void Configure(EntityTypeBuilder<DirectionItems> builder)
        {
            builder.ToTable("DirectionItems");

            builder.HasKey(di => di.Id);


            builder.Property(e => e.Status)
                   .HasConversion<string>();
                   

            // تحويل `StrategicDirectionPointType` إلى نصوص عند التخزين في قاعدة البيانات
            builder.Property(e => e.Type)
                  .HasConversion<string>();
            builder.HasOne(a => a.PlanDirection)
                .WithMany(pa => pa.DirectionItems)
                .HasForeignKey(a => a.PlanDirectionId);
            builder.HasMany(i => i.DirectionItemsElements)
                .WithOne(i => i.DirectionItems)
                .HasForeignKey(i => i.DirectionItemsId);


        }
    }
}
