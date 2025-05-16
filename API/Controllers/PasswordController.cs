using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using API.Entities;
using API.DTO;
using System.Threading.Tasks;
using API.Extensions;

namespace API.Controllers;

public class PasswordController : BaseAPIController
{
    private readonly UserManager<AppUser> _userManager;

    public PasswordController(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public class DirectPasswordChangeRequest
    {
        public string Username { get; set; }
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }

    public class DirectAddPasswordRequest
    {
        public string Username { get; set; }
        public string NewPassword { get; set; }
    }

    [HttpPost("direct-change")]
    public async Task<IActionResult> DirectPasswordChange([FromBody] DirectPasswordChangeRequest request)
    {
        if (string.IsNullOrEmpty(request.Username) ||
            string.IsNullOrEmpty(request.CurrentPassword) ||
            string.IsNullOrEmpty(request.NewPassword))
        {
            return BadRequest("All fields are required");
        }

        var user = await _userManager.FindByNameAsync(request.Username);
        if (user == null)
        {
            return BadRequest("User not found");
        }

        // Verify current password
        var isCurrentPasswordValid = await _userManager.CheckPasswordAsync(user, request.CurrentPassword);
        if (!isCurrentPasswordValid)
        {
            return BadRequest("Current password is incorrect");
        }

        // Change password directly using UserManager
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

        if (result.Succeeded)
        {
            return Ok(new { message = "Password changed successfully" });
        }
        else
        {
            return BadRequest(new { errors = result.Errors });
        }
    }

    [HttpPost("direct-add")]
    public async Task<IActionResult> DirectAddPassword([FromBody] DirectAddPasswordRequest request)
    {
        if (string.IsNullOrEmpty(request.Username) ||
            string.IsNullOrEmpty(request.NewPassword))
        {
            return BadRequest("All fields are required");
        }

        var user = await _userManager.FindByNameAsync(request.Username);
        if (user == null)
        {
            return BadRequest("User not found");
        }

        // Generate token and set password directly
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);

        if (result.Succeeded)
        {
            // Update the flag indicating the user has set a password
            user.HasChangedGenericPassword = true;
            await _userManager.UpdateAsync(user);
            
            return Ok(new { message = "Password added successfully" });
        }
        else
        {
            return BadRequest(new { errors = result.Errors });
        }
    }
}