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
        .OnDelete(DeleteBehavior.Cascade); // set null when user is deleted

        // User - RefreshToken relationship (One to many)
        builder.Entity<AppUser>()
         .HasMany(rt => rt.RefreshTokens)
         .WithOne(u => u.AppUser)
         .HasForeignKey(rt => rt.AppUserId)
         .OnDelete(DeleteBehavior.Cascade); //cascade delete refresh tokens when user is deleted
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

        // Configure many-to-many relationship between Prediction and Category
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

        // Composite key for auxiliary table (if needed)
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

        // PostBracket and AppUser
        builder.Entity<PostBracket>()
            .HasOne(p => p.User)
            .WithMany(u => u.PostBrackets)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        // Brackets belonging to a RootBracket
        builder.Entity<Bracket>()
            .HasOne(b => b.RootBracket)
            .WithMany(r => r.Brackets)
            .HasForeignKey(b => b.RootBracketId)
            .OnDelete(DeleteBehavior.NoAction);

        #endregion
        #region RankingDbConfig
        // User - Ranking relationship (One to many)
        builder.Entity<AppUser>()
         .HasMany(r => r.PostRanks)
         .WithOne(u => u.User)
         .HasForeignKey(r => r.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RankTable>()
            .HasMany(r => r.Rows)
            .WithOne(u => u.RankTable)
            .HasForeignKey(r => r.RankTableId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Row>()
            .HasOne(r => r.RankTable)
            .WithMany(t => t.Rows)
            .HasForeignKey(r => r.RankTableId)
            .OnDelete(DeleteBehavior.Cascade);

        #endregion
        #region DiscussionPostDbConfig
        builder.Entity<DiscussionPost>()
            .HasOne(d => d.User)
            .WithMany(u => u.DiscussionPosts)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.NoAction);
        #endregion
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
            .HasMaxLength(1000)
            .HasDefaultValue(string.Empty);

        builder.Entity<Team>()
            .Property(t => t.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("GETUTCDATE()");

        builder.Entity<Team>()
            .Property(t => t.PhotoUrl)
            .HasMaxLength(500);

        builder.Entity<Team>()
            .HasIndex(t => new { t.CreatedByUserId, t.Name })
            .IsUnique(); // Prevent duplicate team names per user
            }
}