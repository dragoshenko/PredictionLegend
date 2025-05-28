using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace API.Migrations
{
    /// <inheritdoc />
    public partial class FixBingo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastActive = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EmailVerificationCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmailVerificationCodeExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PasswordResetCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PasswordResetCodeExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CommentsCount = table.Column<int>(type: "int", nullable: false),
                    PasswordChangeCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PasswordChangeCodeExpiry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    HasChangedGenericPassword = table.Column<bool>(type: "bit", nullable: false),
                    WasWarnedAboutPasswordChange = table.Column<bool>(type: "bit", nullable: false),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IconName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ColorCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ParentCategoryId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_Categories_ParentCategoryId",
                        column: x => x.ParentCategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BingoTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GridSize = table.Column<int>(type: "int", nullable: false),
                    OfficialTemplate = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BingoTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BingoTemplates_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BracketTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OfficialTemplate = table.Column<bool>(type: "bit", nullable: false),
                    NumberOfRounds = table.Column<int>(type: "int", nullable: false),
                    NumberOfBrackets = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    BracketType = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BracketTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BracketTemplates_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DiscussionPosts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PrivacyType = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModified = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false),
                    AccessCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Tags = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DiscussionPosts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DiscussionPosts_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Photos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Url = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PublicId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AppUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Photos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Photos_AspNetUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Predictions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PredictionType = table.Column<int>(type: "int", nullable: false),
                    PrivacyType = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastModified = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDraft = table.Column<bool>(type: "bit", nullable: false),
                    AccessCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Predictions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Predictions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RankingTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OfficialTemplate = table.Column<bool>(type: "bit", nullable: false),
                    NumberOfRows = table.Column<int>(type: "int", nullable: false),
                    NumberOfColumns = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RankingTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RankingTemplates_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshToken",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Token = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Created = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Expires = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Revoked = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AppUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshToken", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshToken_AspNetUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CreationFlows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FlowToken = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PredictionType = table.Column<int>(type: "int", nullable: false),
                    TemplateId = table.Column<int>(type: "int", nullable: true),
                    PredictionId = table.Column<int>(type: "int", nullable: true),
                    SelectedTeamIds = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedTeamIds = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    IsAbandoned = table.Column<bool>(type: "bit", nullable: false),
                    AbandonReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AbandonedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CreationFlows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CreationFlows_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CreationFlows_Predictions_PredictionId",
                        column: x => x.PredictionId,
                        principalTable: "Predictions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PostBingos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    GridSize = table.Column<int>(type: "int", nullable: false),
                    PredictionId = table.Column<int>(type: "int", nullable: false),
                    TotalScore = table.Column<int>(type: "int", nullable: false),
                    IsOfficialResult = table.Column<bool>(type: "bit", nullable: false),
                    BingoTemplateId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostBingos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostBingos_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PostBingos_BingoTemplates_BingoTemplateId",
                        column: x => x.BingoTemplateId,
                        principalTable: "BingoTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PostBingos_Predictions_PredictionId",
                        column: x => x.PredictionId,
                        principalTable: "Predictions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PredictionCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    categoryId = table.Column<int>(type: "int", nullable: false),
                    PredictionId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PredictionCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PredictionCategories_Categories_categoryId",
                        column: x => x.categoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PredictionCategories_Predictions_PredictionId",
                        column: x => x.PredictionId,
                        principalTable: "Predictions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PostRanks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PredictionId = table.Column<int>(type: "int", nullable: false),
                    IsOfficialResult = table.Column<bool>(type: "bit", nullable: false),
                    TotalScore = table.Column<float>(type: "real", nullable: false),
                    RankingTemplateId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostRanks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostRanks_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PostRanks_Predictions_PredictionId",
                        column: x => x.PredictionId,
                        principalTable: "Predictions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PostRanks_RankingTemplates_RankingTemplateId",
                        column: x => x.RankingTemplateId,
                        principalTable: "RankingTemplates",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RankTables",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NumberOfRows = table.Column<int>(type: "int", nullable: false),
                    NumberOfColumns = table.Column<int>(type: "int", nullable: false),
                    PostRankId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RankTables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RankTables_PostRanks_PostRankId",
                        column: x => x.PostRankId,
                        principalTable: "PostRanks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Rows",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Order = table.Column<int>(type: "int", nullable: false),
                    IsWrong = table.Column<bool>(type: "bit", nullable: false),
                    RankTableId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Rows_RankTables_RankTableId",
                        column: x => x.RankTableId,
                        principalTable: "RankTables",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BingoCells",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Score = table.Column<float>(type: "real", nullable: false),
                    Row = table.Column<int>(type: "int", nullable: false),
                    Column = table.Column<int>(type: "int", nullable: false),
                    TeamId = table.Column<int>(type: "int", nullable: true),
                    OfficialScore = table.Column<int>(type: "int", nullable: false),
                    IsWrong = table.Column<bool>(type: "bit", nullable: false),
                    PostBingoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BingoCells", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BingoCells_PostBingos_PostBingoId",
                        column: x => x.PostBingoId,
                        principalTable: "PostBingos",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Brackets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Score = table.Column<float>(type: "real", nullable: false),
                    RootBracketId = table.Column<int>(type: "int", nullable: true),
                    LeftTeamId = table.Column<int>(type: "int", nullable: true),
                    OfficialScoreLeftTeam = table.Column<int>(type: "int", nullable: false),
                    RightTeamId = table.Column<int>(type: "int", nullable: true),
                    OfficialScoreRightTeam = table.Column<int>(type: "int", nullable: false),
                    IsWrong = table.Column<bool>(type: "bit", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Brackets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BracketToBrackets",
                columns: table => new
                {
                    LeftBracketId = table.Column<int>(type: "int", nullable: false),
                    RightBracketId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BracketToBrackets", x => new { x.LeftBracketId, x.RightBracketId });
                    table.ForeignKey(
                        name: "FK_BracketToBrackets_Brackets_LeftBracketId",
                        column: x => x.LeftBracketId,
                        principalTable: "Brackets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BracketToBrackets_Brackets_RightBracketId",
                        column: x => x.RightBracketId,
                        principalTable: "Brackets",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Columns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamId = table.Column<int>(type: "int", nullable: true),
                    OfficialScore = table.Column<int>(type: "int", nullable: false),
                    Order = table.Column<int>(type: "int", nullable: false),
                    RowId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Columns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Columns_Rows_RowId",
                        column: x => x.RowId,
                        principalTable: "Rows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Comments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ParentCommentId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    DiscussionPostId = table.Column<int>(type: "int", nullable: true),
                    PostRankId = table.Column<int>(type: "int", nullable: true),
                    PostBracketId = table.Column<int>(type: "int", nullable: true),
                    PredictionId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comments_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Comments_Comments_ParentCommentId",
                        column: x => x.ParentCommentId,
                        principalTable: "Comments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Comments_DiscussionPosts_DiscussionPostId",
                        column: x => x.DiscussionPostId,
                        principalTable: "DiscussionPosts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Comments_PostRanks_PostRankId",
                        column: x => x.PostRankId,
                        principalTable: "PostRanks",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Comments_Predictions_PredictionId",
                        column: x => x.PredictionId,
                        principalTable: "Predictions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PostBrackets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PredictionId = table.Column<int>(type: "int", nullable: false),
                    RootBracketId = table.Column<int>(type: "int", nullable: false),
                    TotalScore = table.Column<float>(type: "real", nullable: false),
                    IsOfficialResult = table.Column<bool>(type: "bit", nullable: false),
                    BracketTemplateId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostBrackets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostBrackets_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PostBrackets_BracketTemplates_BracketTemplateId",
                        column: x => x.BracketTemplateId,
                        principalTable: "BracketTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PostBrackets_Predictions_PredictionId",
                        column: x => x.PredictionId,
                        principalTable: "Predictions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PhotoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false, defaultValue: ""),
                    Score = table.Column<float>(type: "real", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    BingoTemplateId = table.Column<int>(type: "int", nullable: true),
                    BracketTemplateId = table.Column<int>(type: "int", nullable: true),
                    PostBingoId = table.Column<int>(type: "int", nullable: true),
                    PostBracketId = table.Column<int>(type: "int", nullable: true),
                    PostRankId = table.Column<int>(type: "int", nullable: true),
                    RankingTemplateId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Teams_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Teams_BingoTemplates_BingoTemplateId",
                        column: x => x.BingoTemplateId,
                        principalTable: "BingoTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Teams_BracketTemplates_BracketTemplateId",
                        column: x => x.BracketTemplateId,
                        principalTable: "BracketTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Teams_PostBingos_PostBingoId",
                        column: x => x.PostBingoId,
                        principalTable: "PostBingos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Teams_PostBrackets_PostBracketId",
                        column: x => x.PostBracketId,
                        principalTable: "PostBrackets",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Teams_PostRanks_PostRankId",
                        column: x => x.PostRankId,
                        principalTable: "PostRanks",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Teams_RankingTemplates_RankingTemplateId",
                        column: x => x.RankingTemplateId,
                        principalTable: "RankingTemplates",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RootBrackets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Score = table.Column<float>(type: "real", nullable: false),
                    BracketType = table.Column<int>(type: "int", nullable: false),
                    LeftTeamId = table.Column<int>(type: "int", nullable: true),
                    OfficialScoreLeftTeam = table.Column<int>(type: "int", nullable: false),
                    RightTeamId = table.Column<int>(type: "int", nullable: true),
                    OfficialScoreRightTeam = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RootBrackets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RootBrackets_Teams_LeftTeamId",
                        column: x => x.LeftTeamId,
                        principalTable: "Teams",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RootBrackets_Teams_RightTeamId",
                        column: x => x.RightTeamId,
                        principalTable: "Teams",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_BingoCells_PostBingoId",
                table: "BingoCells",
                column: "PostBingoId");

            migrationBuilder.CreateIndex(
                name: "IX_BingoCells_TeamId",
                table: "BingoCells",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_BingoTemplates_UserId",
                table: "BingoTemplates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Brackets_LeftTeamId",
                table: "Brackets",
                column: "LeftTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Brackets_RightTeamId",
                table: "Brackets",
                column: "RightTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Brackets_RootBracketId",
                table: "Brackets",
                column: "RootBracketId");

            migrationBuilder.CreateIndex(
                name: "IX_BracketTemplates_UserId",
                table: "BracketTemplates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BracketToBrackets_RightBracketId",
                table: "BracketToBrackets",
                column: "RightBracketId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_ParentCategoryId",
                table: "Categories",
                column: "ParentCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Columns_RowId",
                table: "Columns",
                column: "RowId");

            migrationBuilder.CreateIndex(
                name: "IX_Columns_TeamId",
                table: "Columns",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_DiscussionPostId",
                table: "Comments",
                column: "DiscussionPostId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_ParentCommentId",
                table: "Comments",
                column: "ParentCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_PostBracketId",
                table: "Comments",
                column: "PostBracketId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_PostRankId",
                table: "Comments",
                column: "PostRankId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_PredictionId",
                table: "Comments",
                column: "PredictionId");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_UserId",
                table: "Comments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CreationFlows_FlowToken",
                table: "CreationFlows",
                column: "FlowToken",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CreationFlows_PredictionId",
                table: "CreationFlows",
                column: "PredictionId");

            migrationBuilder.CreateIndex(
                name: "IX_CreationFlows_UserId",
                table: "CreationFlows",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DiscussionPosts_UserId",
                table: "DiscussionPosts",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Photos_AppUserId",
                table: "Photos",
                column: "AppUserId",
                unique: true,
                filter: "[AppUserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PostBingos_BingoTemplateId",
                table: "PostBingos",
                column: "BingoTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_PostBingos_PredictionId",
                table: "PostBingos",
                column: "PredictionId");

            migrationBuilder.CreateIndex(
                name: "IX_PostBingos_UserId",
                table: "PostBingos",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PostBrackets_BracketTemplateId",
                table: "PostBrackets",
                column: "BracketTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_PostBrackets_PredictionId",
                table: "PostBrackets",
                column: "PredictionId");

            migrationBuilder.CreateIndex(
                name: "IX_PostBrackets_RootBracketId",
                table: "PostBrackets",
                column: "RootBracketId");

            migrationBuilder.CreateIndex(
                name: "IX_PostBrackets_UserId",
                table: "PostBrackets",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PostRanks_PredictionId",
                table: "PostRanks",
                column: "PredictionId");

            migrationBuilder.CreateIndex(
                name: "IX_PostRanks_RankingTemplateId",
                table: "PostRanks",
                column: "RankingTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_PostRanks_UserId",
                table: "PostRanks",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PredictionCategories_categoryId",
                table: "PredictionCategories",
                column: "categoryId");

            migrationBuilder.CreateIndex(
                name: "IX_PredictionCategories_PredictionId",
                table: "PredictionCategories",
                column: "PredictionId");

            migrationBuilder.CreateIndex(
                name: "IX_Predictions_UserId",
                table: "Predictions",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RankingTemplates_UserId",
                table: "RankingTemplates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RankTables_PostRankId",
                table: "RankTables",
                column: "PostRankId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshToken_AppUserId",
                table: "RefreshToken",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RootBrackets_LeftTeamId",
                table: "RootBrackets",
                column: "LeftTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_RootBrackets_RightTeamId",
                table: "RootBrackets",
                column: "RightTeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Rows_RankTableId",
                table: "Rows",
                column: "RankTableId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_BingoTemplateId",
                table: "Teams",
                column: "BingoTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_BracketTemplateId",
                table: "Teams",
                column: "BracketTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_CreatedByUserId",
                table: "Teams",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_PostBingoId",
                table: "Teams",
                column: "PostBingoId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_PostBracketId",
                table: "Teams",
                column: "PostBracketId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_PostRankId",
                table: "Teams",
                column: "PostRankId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_RankingTemplateId",
                table: "Teams",
                column: "RankingTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_UserId_Name",
                table: "Teams",
                columns: new[] { "CreatedByUserId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_BingoCells_Teams_TeamId",
                table: "BingoCells",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Brackets_RootBrackets_RootBracketId",
                table: "Brackets",
                column: "RootBracketId",
                principalTable: "RootBrackets",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Brackets_Teams_LeftTeamId",
                table: "Brackets",
                column: "LeftTeamId",
                principalTable: "Teams",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Brackets_Teams_RightTeamId",
                table: "Brackets",
                column: "RightTeamId",
                principalTable: "Teams",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Columns_Teams_TeamId",
                table: "Columns",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_PostBrackets_PostBracketId",
                table: "Comments",
                column: "PostBracketId",
                principalTable: "PostBrackets",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PostBrackets_RootBrackets_RootBracketId",
                table: "PostBrackets",
                column: "RootBracketId",
                principalTable: "RootBrackets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BingoTemplates_AspNetUsers_UserId",
                table: "BingoTemplates");

            migrationBuilder.DropForeignKey(
                name: "FK_BracketTemplates_AspNetUsers_UserId",
                table: "BracketTemplates");

            migrationBuilder.DropForeignKey(
                name: "FK_PostBingos_AspNetUsers_UserId",
                table: "PostBingos");

            migrationBuilder.DropForeignKey(
                name: "FK_PostBrackets_AspNetUsers_UserId",
                table: "PostBrackets");

            migrationBuilder.DropForeignKey(
                name: "FK_PostRanks_AspNetUsers_UserId",
                table: "PostRanks");

            migrationBuilder.DropForeignKey(
                name: "FK_Predictions_AspNetUsers_UserId",
                table: "Predictions");

            migrationBuilder.DropForeignKey(
                name: "FK_RankingTemplates_AspNetUsers_UserId",
                table: "RankingTemplates");

            migrationBuilder.DropForeignKey(
                name: "FK_Teams_AspNetUsers_CreatedByUserId",
                table: "Teams");

            migrationBuilder.DropForeignKey(
                name: "FK_Teams_PostBingos_PostBingoId",
                table: "Teams");

            migrationBuilder.DropForeignKey(
                name: "FK_RootBrackets_Teams_LeftTeamId",
                table: "RootBrackets");

            migrationBuilder.DropForeignKey(
                name: "FK_RootBrackets_Teams_RightTeamId",
                table: "RootBrackets");

            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "BingoCells");

            migrationBuilder.DropTable(
                name: "BracketToBrackets");

            migrationBuilder.DropTable(
                name: "Columns");

            migrationBuilder.DropTable(
                name: "Comments");

            migrationBuilder.DropTable(
                name: "CreationFlows");

            migrationBuilder.DropTable(
                name: "Photos");

            migrationBuilder.DropTable(
                name: "PredictionCategories");

            migrationBuilder.DropTable(
                name: "RefreshToken");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "Brackets");

            migrationBuilder.DropTable(
                name: "Rows");

            migrationBuilder.DropTable(
                name: "DiscussionPosts");

            migrationBuilder.DropTable(
                name: "Categories");

            migrationBuilder.DropTable(
                name: "RankTables");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "PostBingos");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropTable(
                name: "BingoTemplates");

            migrationBuilder.DropTable(
                name: "PostBrackets");

            migrationBuilder.DropTable(
                name: "PostRanks");

            migrationBuilder.DropTable(
                name: "BracketTemplates");

            migrationBuilder.DropTable(
                name: "RootBrackets");

            migrationBuilder.DropTable(
                name: "Predictions");

            migrationBuilder.DropTable(
                name: "RankingTemplates");
        }
    }
}
