using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class FixBingoPost : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BingoCells_Teams_TeamId",
                table: "BingoCells");

            migrationBuilder.DropForeignKey(
                name: "FK_PostBingos_AspNetUsers_UserId",
                table: "PostBingos");

            migrationBuilder.DropForeignKey(
                name: "FK_PostBingos_Predictions_PredictionId",
                table: "PostBingos");

            migrationBuilder.AlterColumn<int>(
                name: "PredictionId",
                table: "PostBingos",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_PostBingos_Predictions_PredictionId",
                table: "PostBingos",
                column: "PredictionId",
                principalTable: "Predictions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BingoCells_Teams_TeamId",
                table: "BingoCells");

            migrationBuilder.DropForeignKey(
                name: "FK_PostBingos_AspNetUsers_UserId",
                table: "PostBingos");

            migrationBuilder.DropForeignKey(
                name: "FK_PostBingos_Predictions_PredictionId",
                table: "PostBingos");

            migrationBuilder.AlterColumn<int>(
                name: "PredictionId",
                table: "PostBingos",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_BingoCells_Teams_TeamId",
                table: "BingoCells",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PostBingos_AspNetUsers_UserId",
                table: "PostBingos",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PostBingos_Predictions_PredictionId",
                table: "PostBingos",
                column: "PredictionId",
                principalTable: "Predictions",
                principalColumn: "Id");
        }
    }
}
