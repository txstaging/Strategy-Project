using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mod.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddPercentageAsProjectItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Step 1: Add PercentageId column as nullable first
            migrationBuilder.AddColumn<int>(
                name: "PercentageId",
                table: "PlanProjects",
                type: "integer",
                nullable: true);

            // Step 2: For each existing project, create a ProjectItems row with default '0'
            // (old Percentage column was already dropped)
            migrationBuilder.Sql(@"
                DO $$
                DECLARE
                    rec RECORD;
                    new_item_id INT;
                BEGIN
                    FOR rec IN SELECT ""Id"" FROM ""PlanProjects""
                    LOOP
                        INSERT INTO ""ProjectItems"" (""Value"", ""Status"", ""Comment"", ""IsDeleted"", ""DeletedAt"", ""UpdatedAt"", ""CreatedAt"")
                        VALUES ('0', 1, NULL, false, NULL, NOW(), NOW())
                        RETURNING ""Id"" INTO new_item_id;

                        UPDATE ""PlanProjects"" SET ""PercentageId"" = new_item_id WHERE ""Id"" = rec.""Id"";
                    END LOOP;
                END $$;
            ");

            // Step 3: Make PercentageId non-nullable
            migrationBuilder.AlterColumn<int>(
                name: "PercentageId",
                table: "PlanProjects",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Step 4: Add index and foreign key
            migrationBuilder.CreateIndex(
                name: "IX_PlanProjects_PercentageId",
                table: "PlanProjects",
                column: "PercentageId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlanProjects_ProjectItems_PercentageId",
                table: "PlanProjects",
                column: "PercentageId",
                principalTable: "ProjectItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlanProjects_ProjectItems_PercentageId",
                table: "PlanProjects");

            migrationBuilder.DropIndex(
                name: "IX_PlanProjects_PercentageId",
                table: "PlanProjects");

            migrationBuilder.DropColumn(
                name: "PercentageId",
                table: "PlanProjects");

            migrationBuilder.AddColumn<double>(
                name: "Percentage",
                table: "PlanProjects",
                type: "double precision",
                nullable: true);
        }
    }
}
