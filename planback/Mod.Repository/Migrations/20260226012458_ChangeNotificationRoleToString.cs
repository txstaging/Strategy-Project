using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mod.Repository.Migrations
{
    /// <inheritdoc />
    public partial class ChangeNotificationRoleToString : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Convert existing integer values to role name strings before changing column type
            migrationBuilder.Sql("""
                ALTER TABLE "NotificationRolesTarget" ALTER COLUMN "Role" TYPE text
                USING CASE "Role"
                    WHEN 0 THEN 'Admin'
                    WHEN 1 THEN 'UnitEmployee'
                    WHEN 2 THEN 'UnitManager'
                    WHEN 3 THEN 'RegionManager'
                    WHEN 4 THEN 'HighManagement'
                    ELSE 'Unknown'
                END;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "NotificationRolesTarget" ALTER COLUMN "Role" TYPE integer
                USING CASE "Role"
                    WHEN 'Admin' THEN 0
                    WHEN 'UnitEmployee' THEN 1
                    WHEN 'UnitManager' THEN 2
                    WHEN 'RegionManager' THEN 3
                    WHEN 'HighManagement' THEN 4
                    ELSE 0
                END;
                """);
        }
    }
}
