using API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace API.Data;

public class Seed
{
    public static async Task SeedUsers(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager)
    {
        // Check if there are any users
        if (await userManager.Users.AnyAsync()) return;

        // Create roles if they don't exist
        var roles = new List<AppRole>
        {
            new AppRole { Name = "Member" },
            new AppRole { Name = "Moderator" },
            new AppRole { Name = "Admin" }
        };

        foreach (var role in roles)
        {
            await roleManager.CreateAsync(role);
        }

        // Create admin user
        var adminUser = new AppUser
        {
            UserName = "admin",
            DisplayName = "Administrator",
            Email = "admin@example.com",
            EmailConfirmed = true,
            HasChangedGenericPassword = true,
            WasWarnedAboutPasswordChange = true,
            CreatedAt = DateTime.UtcNow,
            LastActive = DateTime.UtcNow
        };

        await userManager.CreateAsync(adminUser, "Admin123!");
        await userManager.AddToRolesAsync(adminUser, new[] { "Admin" });
    }
    
    public static async Task SeedCategories(DataContext context)
    {
        // Check if there are any categories
        if (await context.Categories.AnyAsync()) return;
        
        var categories = new List<Category>
        {
            new Category { 
                Name = "Sports", 
                Description = "Sports and athletics predictions", 
                IconName = "fa-trophy", 
                ColorCode = "#e74c3c"
            },
            new Category { 
                Name = "Entertainment", 
                Description = "Movies, TV shows, and entertainment predictions", 
                IconName = "fa-film", 
                ColorCode = "#9b59b6"
            },
            new Category { 
                Name = "Business", 
                Description = "Finance, stocks, and business predictions", 
                IconName = "fa-chart-line", 
                ColorCode = "#2ecc71"
            },
            new Category { 
                Name = "Technology", 
                Description = "Tech industry and innovation predictions", 
                IconName = "fa-microchip", 
                ColorCode = "#3498db"
            },
            new Category { 
                Name = "Politics", 
                Description = "Elections and political predictions", 
                IconName = "fa-landmark", 
                ColorCode = "#e67e22"
            },
            new Category { 
                Name = "Science", 
                Description = "Scientific breakthroughs and discoveries", 
                IconName = "fa-flask", 
                ColorCode = "#1abc9c"
            }
        };
        
        // Add subcategories for Sports
        var sportsCategory = categories.First(c => c.Name == "Sports");
        var sportsSubcategories = new List<Category>
        {
            new Category { 
                Name = "Basketball", 
                Description = "NBA, FIBA, and other basketball predictions", 
                IconName = "fa-basketball-ball", 
                ColorCode = "#c0392b",
                ParentCategory = sportsCategory
            },
            new Category { 
                Name = "Football", 
                Description = "NFL, college football, and other football predictions", 
                IconName = "fa-football-ball", 
                ColorCode = "#d35400",
                ParentCategory = sportsCategory
            },
            new Category { 
                Name = "Soccer", 
                Description = "FIFA, UEFA, and other soccer predictions", 
                IconName = "fa-futbol", 
                ColorCode = "#27ae60",
                ParentCategory = sportsCategory
            },
            new Category { 
                Name = "Baseball", 
                Description = "MLB and other baseball predictions", 
                IconName = "fa-baseball-ball", 
                ColorCode = "#f1c40f",
                ParentCategory = sportsCategory
            }
        };
        
        // Add subcategories for Entertainment
        var entertainmentCategory = categories.First(c => c.Name == "Entertainment");
        var entertainmentSubcategories = new List<Category>
        {
            new Category { 
                Name = "Movies", 
                Description = "Film awards and box office predictions", 
                IconName = "fa-film", 
                ColorCode = "#8e44ad",
                ParentCategory = entertainmentCategory
            },
            new Category { 
                Name = "TV Shows", 
                Description = "Television series and awards predictions", 
                IconName = "fa-tv", 
                ColorCode = "#9b59b6",
                ParentCategory = entertainmentCategory
            },
            new Category { 
                Name = "Music", 
                Description = "Music awards and chart predictions", 
                IconName = "fa-music", 
                ColorCode = "#6c3483",
                ParentCategory = entertainmentCategory
            }
        };
        
        // Add all subcategories
        categories.AddRange(sportsSubcategories);
        categories.AddRange(entertainmentSubcategories);
        
        // Save categories to database
        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();
    }
}