using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class DataContext(DbContextOptions options) : IdentityDbContext<AppUser, AppRole, int, IdentityUserClaim<int>, AppUserRole, IdentityUserLogin<int>, IdentityRoleClaim<int>, IdentityUserToken<int>>(options) //specific order for this one
{
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Comment> Comments { get; set; } = null!;
    public DbSet<DiscussionPost> DiscussionPosts { get; set; } = null!;
    public DbSet<Photo> Photos { get; set; } = null!;
    public DbSet<Team> Teams { get; set; } = null!;
    public DbSet<CreationFlow> CreationFlows { get; set; } = null!; // Added

    #region PredictionDbConfig
    public DbSet<Prediction> Predictions { get; set; } = null!;
    public DbSet<PredictionCategory> PredictionCategories { get; set; } = null!;
    // brackets
    public DbSet<BracketTemplate> BracketTemplates { get; set; } = null!;
    public DbSet<PostBracket> PostBrackets { get; set; } = null!;
    public DbSet<RootBracket> RootBrackets { get; set; } = null!;
    public DbSet<Bracket> Brackets { get; set; } = null!;
    public DbSet<BracketToBracket> BracketToBrackets { get; set; } = null!;
    // ranking
    public DbSet<RankingTemplate> RankingTemplates { get; set; } = null!;
    public DbSet<RankTable> RankTables { get; set; } = null!;
    public DbSet<Row> Rows { get; set; } = null!;
    public DbSet<Column> Columns { get; set; } = null!;
    public DbSet<PostRank> PostRanks { get; set; } = null!;
    // bingo
    public DbSet<BingoTemplate> BingoTemplates { get; set; } = null!;
    public DbSet<BingoCell> BingoCells { get; set; } = null!;
    public DbSet<PostBingo> PostBingos { get; set; } = null!;
    #endregion


    protected override void OnModelCreating(ModelBuilder builder)
    {
        #region UserDbConfig
        base.OnModelCreating(builder);
        // User - Role relationship (One to many)
        builder.Entity<AppUser>()
         .HasMany(ur => ur.UserRoles)
         .WithOne(u => u.User)
         .HasForeignKey(ur => ur.UserId)
         .IsRequired();

        builder.Entity<AppUser>()
        .HasOne(u => u.Photo)
        .WithOne(p => p.AppUser)
        .HasForeignKey<Photo>(p => p.AppUserId)
        .OnDelete(DeleteBehavior.Cascade);

        // User - RefreshToken relationship (One to many)
        builder.Entity<AppUser>()
         .HasMany(rt => rt.RefreshTokens)
         .WithOne(u => u.AppUser)
         .HasForeignKey(rt => rt.AppUserId)
         .OnDelete(DeleteBehavior.Cascade);

        // Role - User relationship (One to many)
        builder.Entity<AppRole>()
         .HasMany(ur => ur.UserRoles)
         .WithOne(u => u.Role)
         .HasForeignKey(ur => ur.RoleId)
         .IsRequired();

        builder.Entity<AppUser>()
           .HasMany(p => p.Predictions)
           .WithOne(u => u.User)
           .HasForeignKey(p => p.UserId)
           .OnDelete(DeleteBehavior.NoAction);
        #endregion

        #region PredictionDbConfig - FIXED FOR COUNTER PREDICTIONS

        // Prediction to PostRank (One-to-Many) - FIXED to support multiple users per prediction
        builder.Entity<Prediction>()
            .HasMany(p => p.PostRanks)
            .WithOne(pr => pr.Prediction)
            .HasForeignKey(pr => pr.PredictionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Prediction to PostBingo (One-to-Many) - FIXED to support multiple users per prediction
        builder.Entity<Prediction>()
            .HasMany(p => p.PostBingos)
            .WithOne(pb => pb.Prediction)
            .HasForeignKey(pb => pb.PredictionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Prediction to PostBracket (One-to-Many) - FIXED to support multiple users per prediction
        builder.Entity<Prediction>()
            .HasMany(p => p.PostBrackets)
            .WithOne(pb => pb.Prediction)
            .HasForeignKey(pb => pb.PredictionId)
            .OnDelete(DeleteBehavior.Cascade);

        // PostRank to User (Many-to-One) - User can have multiple PostRanks
        builder.Entity<PostRank>()
            .HasOne(pr => pr.User)
            .WithMany(u => u.PostRanks)
            .HasForeignKey(pr => pr.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        // PostBingo to User (Many-to-One) - User can have multiple PostBingos
        builder.Entity<PostBingo>()
            .HasOne(pb => pb.User)
            .WithMany(u => u.PostBingos)
            .HasForeignKey(pb => pb.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        // PostBracket to User (Many-to-One) - User can have multiple PostBrackets
        builder.Entity<PostBracket>()
            .HasOne(pb => pb.User)
            .WithMany(u => u.PostBrackets)
            .HasForeignKey(pb => pb.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        // PostRank to RankTable (One-to-One)
        builder.Entity<PostRank>()
            .HasOne(pr => pr.RankTable)
            .WithOne(rt => rt.PostRank)
            .HasForeignKey<RankTable>(rt => rt.PostRankId)
            .OnDelete(DeleteBehavior.Cascade);

        // RankTable to Rows (One-to-Many)
        builder.Entity<RankTable>()
            .HasMany(rt => rt.Rows)
            .WithOne()
            .HasForeignKey("RankTableId")
            .OnDelete(DeleteBehavior.Cascade);

        // Row to Columns (One-to-Many)
        builder.Entity<Row>()
            .HasMany(r => r.Columns)
            .WithOne()
            .HasForeignKey("RowId")
            .OnDelete(DeleteBehavior.Cascade);

        // Column to Team (Many-to-One)
        builder.Entity<Column>()
            .HasOne(c => c.Team)
            .WithMany()
            .HasForeignKey("TeamId")
            .OnDelete(DeleteBehavior.SetNull);

        // PostBingo to BingoCells (One-to-Many)
        builder.Entity<PostBingo>()
            .HasMany(pb => pb.BingoCells)
            .WithOne()
            .HasForeignKey("PostBingoId")
            .OnDelete(DeleteBehavior.Cascade);

        // BingoCell to Team (Many-to-One)
        builder.Entity<BingoCell>()
            .HasOne(bc => bc.Team)
            .WithMany()
            .HasForeignKey(bc => bc.TeamId)
            .OnDelete(DeleteBehavior.SetNull);

        #endregion

        #region CreationFlowDbConfig
        builder.Entity<CreationFlow>()
            .HasOne(cf => cf.User)
            .WithMany()
            .HasForeignKey(cf => cf.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<CreationFlow>()
            .HasOne(cf => cf.Prediction)
            .WithMany()
            .HasForeignKey(cf => cf.PredictionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<CreationFlow>()
            .HasIndex(cf => cf.FlowToken)
            .IsUnique();
        #endregion

        #region CategoryDbConfig
        // Configure Category entity
        builder.Entity<Category>()
            .HasMany(c => c.SubCategories)
            .WithOne(c => c.ParentCategory)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        #endregion

        #region CommentDbConfig
        builder.Entity<Comment>()
        .HasOne(c => c.ParentComment)
        .WithMany(c => c.Replies)
        .HasForeignKey(c => c.ParentCommentId)
        .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Comment>()
            .HasOne(c => c.DiscussionPost)
            .WithMany(p => p.Comments)
            .HasForeignKey(c => c.DiscussionPostId)
            .OnDelete(DeleteBehavior.NoAction);
        #endregion

        #region BracketDbConfig
        // Composite key for auxiliary table
        builder.Entity<BracketToBracket>()
         .HasKey(b => new { b.LeftBracketId, b.RightBracketId });

        builder.Entity<BracketToBracket>()
            .HasOne(b => b.LeftBracket)
            .WithMany()
            .HasForeignKey(b => b.LeftBracketId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<BracketToBracket>()
            .HasOne(b => b.RightBracket)
            .WithMany()
            .HasForeignKey(b => b.RightBracketId)
            .OnDelete(DeleteBehavior.NoAction);

        // Brackets belonging to a RootBracket
        builder.Entity<Bracket>()
            .HasOne(b => b.RootBracket)
            .WithMany(r => r.Brackets)
            .HasForeignKey(b => b.RootBracketId)
            .OnDelete(DeleteBehavior.NoAction);
        #endregion

        #region DiscussionPostDbConfig
        builder.Entity<DiscussionPost>()
            .HasOne(d => d.User)
            .WithMany(u => u.DiscussionPosts)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.NoAction);
        #endregion

        #region TeamDbConfig
        builder.Entity<Team>()
            .HasOne(t => t.CreatedByUser)
            .WithMany(u => u.Teams)
            .HasForeignKey(t => t.CreatedByUserId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Team>()
            .Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Entity<Team>()
            .Property(t => t.Description)
            .IsRequired()
            .HasMaxLength(500)
            .HasDefaultValue(string.Empty);

        builder.Entity<Team>()
            .Property(t => t.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Entity<Team>()
            .Property(t => t.PhotoUrl)
            .HasMaxLength(500);

        // Create unique constraint on Name + CreatedByUserId
        builder.Entity<Team>()
            .HasIndex(t => new { t.CreatedByUserId, t.Name })
            .IsUnique()
            .HasDatabaseName("IX_Teams_UserId_Name");

        // Add index on CreatedByUserId for better query performance
        builder.Entity<Team>()
            .HasIndex(t => t.CreatedByUserId)
            .HasDatabaseName("IX_Teams_CreatedByUserId");
        #endregion
    }
}