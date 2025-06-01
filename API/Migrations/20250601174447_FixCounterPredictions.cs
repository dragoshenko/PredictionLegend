using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class FixCounterPredictions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BingoCells_PostBingos_PostBingoId",
                table: "BingoCells");

            migrationBuilder.DropForeignKey(
                name: "FK_BingoCells_Teams_TeamId",
                table: "BingoCells");

            migrationBuilder.DropForeignKey(
                name: "FK_PostBingos_AspNetUsers_UserId",
                table: "PostBingos");

            migrationBuilder.AddForeignKey(
                name: "FK_BingoCells_PostBingos_PostBingoId",
                table: "BingoCells",
                column: "PostBingoId",
                principalTable: "PostBingos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BingoCells_Teams_TeamId",
                table: "BingoCells",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PostBingos_AspNetUsers_UserId",
                table: "PostBingos",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BingoCells_PostBingos_PostBingoId",
                table: "BingoCells");

            migrationBuilder.DropForeignKey(
                name: "FK_BingoCells_Teams_TeamId",
                table: "BingoCells");

            migrationBuilder.DropForeignKey(
                name: "FK_PostBingos_AspNetUsers_UserId",
                table: "PostBingos");

            migrationBuilder.AddForeignKey(
                name: "FK_BingoCells_PostBingos_PostBingoId",
                table: "BingoCells",
                column: "PostBingoId",
                principalTable: "PostBingos",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_BingoCells_Teams_TeamId",
                table: "BingoCells",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PostBingos_AspNetUsers_UserId",
                table: "PostBingos",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
