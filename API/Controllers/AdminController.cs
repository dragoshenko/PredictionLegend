// API/Controllers/AdminController.cs
using System.Diagnostics;
using API.DTO;
using API.Entities;
using API.Extensions;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers;

[Authorize(Policy = "RequireAdminRole")]
public class AdminController : BaseAPIController
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IUnitOfWork _unitOfWork;

    public AdminController(UserManager<AppUser> userManager, IUnitOfWork unitOfWork)
    {
        _userManager = userManager;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<AdminUserDTO>>> GetUsers()
    {
        var users = await _userManager.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .OrderBy(u => u.UserName)
            .Select(u => new AdminUserDTO
            {
                Id = u.Id,
                Username = u.UserName,
                DisplayName = u.DisplayName,
                Email = u.Email,
                EmailConfirmed = u.EmailConfirmed,
                CreatedAt = u.CreatedAt,
                LastActive = u.LastActive,
                Roles = u.UserRoles.Select(r => r.Role.Name).ToList(),
                HasPhoto = u.Photo != null
            })
            .ToListAsync();

        return users;
    }

    [HttpPost("edit-roles/{username}")]
    public async Task<ActionResult> EditRoles(string username, [FromQuery] string roles)
    {
        var selectedRoles = roles.Split(",").ToArray();

        var user = await _userManager.FindByNameAsync(username);

        if (user == null) return NotFound("Could not find user");

        var userRoles = await _userManager.GetRolesAsync(user);

        var result = await _userManager.AddToRolesAsync(user, selectedRoles.Except(userRoles));

        if (!result.Succeeded) return BadRequest("Failed to add to roles");

        result = await _userManager.RemoveFromRolesAsync(user, userRoles.Except(selectedRoles));

        if (!result.Succeeded) return BadRequest("Failed to remove from roles");

        return Ok(await _userManager.GetRolesAsync(user));
    }

    [HttpGet("user/{id}")]
    public async Task<ActionResult<AdminUserDetailDTO>> GetUserDetails(int id)
    {
        var user = await _userManager.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(u => u.Photo)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound("User not found");

        return new AdminUserDetailDTO
        {
            Id = user.Id,
            Username = user.UserName,
            DisplayName = user.DisplayName,
            Email = user.Email,
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt,
            LastActive = user.LastActive,
            Roles = user.UserRoles.Select(r => r.Role.Name).ToList(),
            PhotoUrl = user.Photo?.Url,
            Bio = user.Bio,
            HasChangedGenericPassword = user.HasChangedGenericPassword,
            WasWarnedAboutPasswordChange = user.WasWarnedAboutPasswordChange
        };
    }

    [HttpDelete("user/{id}")]
    public async Task<ActionResult> DeleteUser(int id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());

        if (user == null) return NotFound("User not found");

        // Don't allow deleting your own account
        if (User.GetUserId() == id)
            return BadRequest("You cannot delete your own account");

        var result = await _userManager.DeleteAsync(user);

        if (!result.Succeeded) return BadRequest("Failed to delete user");

        return Ok();
    }
    [HttpGet("system-info")]
    public ActionResult<object> GetSystemInfo()
    {
        // In a real system, you would get this from various system services
        return new
        {
            AppVersion = "1.0.0",
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development",
            ServerTime = DateTime.UtcNow,
            TotalActiveUsers = _userManager.Users.Count(u => u.LastActive > DateTime.UtcNow.AddDays(-30)),
            TotalPredictions = 0, // You would get this from your repository
            ServerUptime = (DateTime.UtcNow - Process.GetCurrentProcess().StartTime.ToUniversalTime()).ToString(@"dd\.hh\:mm\:ss")
        };
    }
}