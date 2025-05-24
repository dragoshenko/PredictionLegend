using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class AddedPost3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BingoTemplateId",
                table: "Teams",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BracketTemplateId",
                table: "Teams",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "RankingTemplates",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "BracketTemplates",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_BingoTemplateId",
                table: "Teams",
                column: "BingoTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_BracketTemplateId",
                table: "Teams",
                column: "BracketTemplateId");

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_BingoTemplates_BingoTemplateId",
                table: "Teams",
                column: "BingoTemplateId",
                principalTable: "BingoTemplates",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Teams_BracketTemplates_BracketTemplateId",
                table: "Teams",
                column: "BracketTemplateId",
                principalTable: "BracketTemplates",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Teams_BingoTemplates_BingoTemplateId",
                table: "Teams");

            migrationBuilder.DropForeignKey(
                name: "FK_Teams_BracketTemplates_BracketTemplateId",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Teams_BingoTemplateId",
                table: "Teams");

            migrationBuilder.DropIndex(
                name: "IX_Teams_BracketTemplateId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "BingoTemplateId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "BracketTemplateId",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "RankingTemplates");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "BracketTemplates");
        }
    }
}
