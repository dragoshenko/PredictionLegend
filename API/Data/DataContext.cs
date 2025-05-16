using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class DataContext(DbContextOptions options) : IdentityDbContext<AppUser, AppRole, int, IdentityUserClaim<int>, AppUserRole, IdentityUserLogin<int>, IdentityRoleClaim<int>, IdentityUserToken<int>>(options) //specific order for this one
{
    public DbSet<Comment> Comments { get; set; }
    public DbSet<PostBracket> PostBrackets { get; set; }
    public DbSet<Bracket> Brackets { get; set; }
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
        #region CommentDbConfig
        builder.Entity<Comment>()
        .HasOne(c => c.ParentComment)
        .WithMany(c => c.Replies)
        .HasForeignKey(c => c.ParentCommentId)
        .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Comment>()
        .HasOne(c => c.User)
        .WithMany(u => u.Comments)
        .HasForeignKey(c => c.UserId)
        .OnDelete(DeleteBehavior.NoAction);

        builder.Entity<Comment>()
        .HasOne(c => c.PostBracket)
        .WithMany(p => p.Comments)
        .HasForeignKey(c => c.PostBracketId)
        .OnDelete(DeleteBehavior.NoAction);


        builder.Entity<Comment>()
            .HasOne(c => c.PostRank)
            .WithMany(p => p.Comments)
            .HasForeignKey(c => c.PostRankId)
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

        // PostBracket and RootBracket (1:1)
        builder.Entity<PostBracket>()
            .HasOne(p => p.RootBracket)
            .WithOne(r => r.PostBracket)
            .HasForeignKey<PostBracket>(p => p.Id)
            .OnDelete(DeleteBehavior.NoAction);

        // RootBracket and Brackets (left & right)
        builder.Entity<RootBracket>()
            .HasOne(r => r.LeftBracket)
            .WithMany()
            .HasForeignKey(r => r.LeftBracketId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<RootBracket>()
            .HasOne(r => r.RightBracket)
            .WithMany()
            .HasForeignKey(r => r.RightBracketId)
            .OnDelete(DeleteBehavior.Restrict);

        // Brackets belonging to a RootBracket
        builder.Entity<Bracket>()
            .HasOne(b => b.RootBracket)
            .WithMany(r => r.Brackets)
            .HasForeignKey(b => b.RootBracketId)
            .OnDelete(DeleteBehavior.NoAction);

        // Bracket self-referencing: Parent → Children
        builder.Entity<Bracket>()
            .HasOne(b => b.ParentBracket)
            .WithMany()
            .HasForeignKey(b => b.ParentBracketId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        // Optional Left and Right children (without navigation from them to parent)
        builder.Entity<Bracket>()
            .HasOne(b => b.LeftBracket)
            .WithMany()
            .HasForeignKey(b => b.LeftBracketId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Bracket>()
            .HasOne(b => b.RightBracket)
            .WithMany()
            .HasForeignKey(b => b.RightBracketId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        #endregion
        #region RankingDbConfig
        // User - Ranking relationship (One to many)
        builder.Entity<AppUser>()
         .HasMany(r => r.PostRanks)
         .WithOne(u => u.User)
         .HasForeignKey(r => r.UserId)
         .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<PostRank>()
            .HasMany(r => r.Rows)
            .WithOne(u => u.PostRank)
            .HasForeignKey(r => r.PostRankId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Row>()
            .HasOne(r => r.PostRank)
            .WithMany(u => u.Rows)
            .HasForeignKey(r => r.PostRankId)
            .OnDelete(DeleteBehavior.Cascade);

        #endregion
        #region DiscussionPostDbConfig
        builder.Entity<DiscussionPost>()
            .HasOne(d => d.User)
            .WithMany(u => u.DiscussionPosts)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.NoAction);
        #endregion
    }
}