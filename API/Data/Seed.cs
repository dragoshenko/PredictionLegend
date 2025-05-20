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
}