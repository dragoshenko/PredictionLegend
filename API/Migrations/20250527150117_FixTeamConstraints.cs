using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class FixTeamConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_Teams_CreatedByUserId_Name",
                table: "Teams",
                newName: "IX_Teams_UserId_Name");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Teams",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldDefaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_CreatedByUserId",
                table: "Teams",
                column: "CreatedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Teams_CreatedByUserId",
                table: "Teams");

            migrationBuilder.RenameIndex(
                name: "IX_Teams_UserId_Name",
                table: "Teams",
                newName: "IX_Teams_CreatedByUserId_Name");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Teams",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500,
                oldDefaultValue: "");
        }
    }
}
