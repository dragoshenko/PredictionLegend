using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class FixPostRankRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Columns_Teams_TeamId",
                table: "Columns");

            migrationBuilder.DropForeignKey(
                name: "FK_PostRanks_AspNetUsers_UserId",
                table: "PostRanks");

            migrationBuilder.AddForeignKey(
                name: "FK_Columns_Teams_TeamId",
                table: "Columns",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PostRanks_AspNetUsers_UserId",
                table: "PostRanks",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Columns_Teams_TeamId",
                table: "Columns");

            migrationBuilder.DropForeignKey(
                name: "FK_PostRanks_AspNetUsers_UserId",
                table: "PostRanks");

            migrationBuilder.AddForeignKey(
                name: "FK_Columns_Teams_TeamId",
                table: "Columns",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PostRanks_AspNetUsers_UserId",
                table: "PostRanks",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
