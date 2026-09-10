namespace Mod.Repository.Data.ModelConfigurations
{
    public class DirectionItemsElementsConfiguration : IEntityTypeConfiguration<DirectionItemsElements>
    {
        public void Configure(EntityTypeBuilder<DirectionItemsElements> builder)
        {
            // Table Name
            builder.ToTable("DirectionItemsElements");

            // Primary Key
            builder.HasKey(die => die.Id);

            // Properties
            builder.Property(die => die.Name)
                   .IsRequired();// مطلوب
                                 // أقصى طول 200 حرف

            builder.Property(e => e.Status)
                   .HasConversion<string>();
            builder.HasOne(i => i.DirectionItems)
          .WithMany(i => i.DirectionItemsElements)
          .HasForeignKey(i => i.DirectionItemsId);



            // أقصى طول للتعليقات هو 500 حرف
        }
    }
}
