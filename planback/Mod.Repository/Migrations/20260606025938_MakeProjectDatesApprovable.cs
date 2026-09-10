using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mod.Repository.Migrations
{
    /// <inheritdoc />
    public partial class MakeProjectDatesApprovable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EndDateItemId",
                table: "PlanProjects",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StartDateItemId",
                table: "PlanProjects",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanProjects_EndDateItemId",
                table: "PlanProjects",
                column: "EndDateItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanProjects_StartDateItemId",
                table: "PlanProjects",
                column: "StartDateItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlanProjects_ProjectItems_EndDateItemId",
                table: "PlanProjects",
                column: "EndDateItemId",
                principalTable: "ProjectItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PlanProjects_ProjectItems_StartDateItemId",
                table: "PlanProjects",
                column: "StartDateItemId",
                principalTable: "ProjectItems",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlanProjects_ProjectItems_EndDateItemId",
                table: "PlanProjects");

            migrationBuilder.DropForeignKey(
                name: "FK_PlanProjects_ProjectItems_StartDateItemId",
                table: "PlanProjects");

            migrationBuilder.DropIndex(
                name: "IX_PlanProjects_EndDateItemId",
                table: "PlanProjects");

            migrationBuilder.DropIndex(
                name: "IX_PlanProjects_StartDateItemId",
                table: "PlanProjects");

            migrationBuilder.DropColumn(
                name: "EndDateItemId",
                table: "PlanProjects");

            migrationBuilder.DropColumn(
                name: "StartDateItemId",
                table: "PlanProjects");
        }
    }
}
