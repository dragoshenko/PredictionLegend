using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class Laptop : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RankingTemplateId",
                table: "Teams",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teams_RankingTemplateId",
                table: "Teams",
                column: "RankingTemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_RankingTemplates_RankingTemplateId",
                table: "Teams",
                column: "RankingTemplateId",
                principalTable: "RankingTemplates",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Teams_RankingTemplates_RankingTemplateId",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Teams_RankingTemplateId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "RankingTemplateId",
                table: "Teams");
        }
    }
}
