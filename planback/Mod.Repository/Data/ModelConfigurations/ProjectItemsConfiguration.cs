using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Mod.Repository.Data.ModelConfigurations
{
    public class ProjectItemsConfiguration : IEntityTypeConfiguration<ProjectItems>
    {
        public void Configure(EntityTypeBuilder<ProjectItems> builder)
        {
            builder.HasKey(g => g.Id);


            builder.Property(g => g.Value)
                   .IsRequired();



            builder.Property(g => g.Status)
                   .HasConversion<string>();
        }
    }
}
