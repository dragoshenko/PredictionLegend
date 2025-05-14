using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace API.Data;

public class DataContext(DbContextOptions options) : IdentityDbContext<AppUser, AppRole, int, IdentityUserClaim<int>, AppUserRole, IdentityUserLogin<int>, IdentityRoleClaim<int>, IdentityUserToken<int>>(options) //specific order for this one
{
   public DbSet<Post> Posts { get; set; }
   public DbSet<Comment> Comments { get; set; }
   public DbSet<Prediction> Predictions { get; set; }
    protected override void OnModelCreating(ModelBuilder builder)
    {
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

         //User - Post relationship (One to many)

         builder.Entity<AppUser>()
         .HasMany(p => p.Posts)
         .WithOne(u => u.AppUser)
         .HasForeignKey(p => p.AppUserId)
         .OnDelete(DeleteBehavior.SetNull); // set null when user is deleted

         // Post - Comment relationship (One to many)

         builder.Entity<Post>()
         .HasMany(p => p.Comments)
         .WithOne(c => c.Post)
         .HasForeignKey(c => c.PostId)
         .OnDelete(DeleteBehavior.Cascade); //cascade delete comments when post is deleted

         //Post - Photo relationship (One to many)
        builder.Entity<Post>()
         .HasMany(p => p.Photos)
         .WithOne(p => p.Post)
         .HasForeignKey(p => p.PostId)
         .OnDelete(DeleteBehavior.Restrict); //cascade delete photos when post is deleted

         //User - Comment relationship (One to many)
         builder.Entity<AppUser>()
         .HasMany(c => c.Comments)
         .WithOne(u => u.AppUser)
         .HasForeignKey(c => c.AppUserId)
         .OnDelete(DeleteBehavior.SetNull); // set null when user is deleted

         //Comment - Parent - Child relationship (Recursive one to many)
        builder.Entity<Comment>()
         .HasOne(c => c.ParentComment)
         .WithMany(c => c.ChildComments)
         .HasForeignKey(c => c.ParentCommentId)
         .OnDelete(DeleteBehavior.Restrict);


         //Comment - Photo relationship (One to many)
         builder.Entity<Comment>()
         .HasMany(c => c.Photos)
         .WithOne(p => p.Comment)
         .HasForeignKey(p => p.CommentId)
         .OnDelete(DeleteBehavior.Cascade); //cascade delete photos when comment is deleted

         builder.Entity<AppUser>()
         .HasMany(p => p.Predictions)
         .WithOne(u => u.AppUser)
         .HasForeignKey(p => p.AppUserId)
         .OnDelete(DeleteBehavior.SetNull); //set null when user is deleted



    }

}
