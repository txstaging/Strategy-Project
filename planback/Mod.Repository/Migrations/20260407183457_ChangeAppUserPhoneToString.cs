using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mod.Repository.Migrations
{
    /// <inheritdoc />
    public partial class ChangeAppUserPhoneToString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""AspNetUsers"" ALTER COLUMN ""Phone"" TYPE text USING ""Phone""::text;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""AspNetUsers"" ALTER COLUMN ""Phone"" TYPE integer USING NULLIF(regexp_replace(""Phone"", '\D', '', 'g'), '')::integer;");
        }
    }
}
