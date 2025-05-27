using API.DTO;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace API.Controllers;

[Authorize]
public class UserController : BaseAPIController
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly IPhotoService _photoService;
    private readonly IEmailService _emailService;
    private readonly UserManager<AppUser> _userManager;

    public UserController(
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        IPhotoService photoService,
        IEmailService emailService, UserManager<AppUser> userManager)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _photoService = photoService;
        _emailService = emailService;
        _userManager = userManager;

    }
    public class DirectProfileUpdateRequest
    {
        public string Username { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
    }

    [HttpPost("direct-profile-update")]
    public async Task<IActionResult> DirectProfileUpdate([FromBody] DirectProfileUpdateRequest request)
    {
        if (string.IsNullOrEmpty(request.Username))
        {
            return BadRequest("Username is required");
        }

        var user = await _userManager.FindByNameAsync(request.Username);
        if (user == null)
        {
            return BadRequest("User not found");
        }

        // Update the properties directly (same as password change approach)
        if (!string.IsNullOrEmpty(request.DisplayName))
        {
            user.DisplayName = request.DisplayName;
        }

        if (request.Bio != null)
        {
            user.Bio = request.Bio;
        }

        // Use UserManager.UpdateAsync directly (same as password change)
        var result = await _userManager.UpdateAsync(user);

        if (result.Succeeded)
        {
            return Ok(new { message = "Profile updated successfully" });
        }
        else
        {
            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            return BadRequest(new { errors = errors });
        }
    }

    // Get current user data
    [HttpGet]
    public async Task<ActionResult<UserDTO>> GetCurrentUser()
    {
        var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        var token = await _tokenService.CreateToken(user);

        return new UserDTO
        {
            Username = user.UserName!,
            Email = user.Email!,
            DisplayName = user.DisplayName,
            Token = token,
            RefreshToken = null, // Don't need to generate a refresh token here
            PhotoUrl = user.Photo?.Url,
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt
        };
    }

    // Get user profile by username
    [HttpGet("{username}")]
    public async Task<ActionResult<MemberDTO>> GetUser(string username)
    {
        var member = await _unitOfWork.UserRepository.GetMemberAsync(username);

        if (member == null) return NotFound();

        return member;
    }

    // Update user profile
    [HttpPut]
    public async Task<ActionResult> UpdateUser(MemberUpdateDTO memberUpdateDTO)
    {
        var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        // Log the incoming data for debugging
        Console.WriteLine($"Received update request for user: {user.UserName}");
        Console.WriteLine($"New DisplayName: {memberUpdateDTO.DisplayName}");
        Console.WriteLine($"New Bio: {memberUpdateDTO.Bio}");

        // Check if display name is being updated
        if (!string.IsNullOrEmpty(memberUpdateDTO.DisplayName) &&
            memberUpdateDTO.DisplayName != user.DisplayName)
        {
            // Check if display name is already in use by another user
            var existingUser = await _unitOfWork.UserRepository.GetUserByDisplayNameAsync(memberUpdateDTO.DisplayName);
            if (existingUser != null && existingUser.Id != user.Id)
            {
                return BadRequest("Display name is already in use");
            }

            user.DisplayName = memberUpdateDTO.DisplayName;
        }

        // Update other user properties
        if (memberUpdateDTO.Bio != null)
            user.Bio = memberUpdateDTO.Bio;
        else
            user.Bio = string.Empty;

        try
        {
            // FOLLOW THE SAME PATTERN AS PASSWORD CHANGE
            // Instead of using UserManager.UpdateAsync, use the repository pattern directly
            // like your working password change does

            // Update the user using the repository (similar to how password change works)
            var repositoryResult = await _unitOfWork.UserRepository.UpdateAsync(user);

            if (!repositoryResult.Succeeded)
            {
                var errors = string.Join(", ", repositoryResult.Errors.Select(e => e.Description));
                Console.WriteLine($"Repository UpdateAsync failed with errors: {errors}");
                return BadRequest($"Failed to update user profile: {errors}");
            }

            // Save changes to database - THIS IS THE KEY STEP that might be missing
            var saveResult = await _unitOfWork.Complete();

            if (!saveResult)
            {
                Console.WriteLine("UnitOfWork.Complete() returned false - database save failed");

                // Try alternative approach - direct UserManager update without repository
                user.DisplayName = memberUpdateDTO.DisplayName ?? user.DisplayName;
                user.Bio = memberUpdateDTO.Bio ?? user.Bio;

                var directResult = await _userManager.UpdateAsync(user);
                if (directResult.Succeeded)
                {
                    Console.WriteLine("Direct UserManager update succeeded");
                    return Ok(new
                    {
                        displayName = user.DisplayName,
                        bio = user.Bio,
                        message = "Profile updated successfully"
                    });
                }
                else
                {
                    var directErrors = string.Join(", ", directResult.Errors.Select(e => e.Description));
                    Console.WriteLine($"Direct UserManager update also failed: {directErrors}");
                    return BadRequest($"Failed to save changes to database. Repository errors: Database save failed. UserManager errors: {directErrors}");
                }
            }

            Console.WriteLine("User profile updated successfully");

            // Return the updated user info
            return Ok(new
            {
                displayName = user.DisplayName,
                bio = user.Bio,
                message = "Profile updated successfully"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception during user update: {ex.Message}");
            Console.WriteLine($"Inner exception: {ex.InnerException?.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return BadRequest($"An error occurred while updating profile: {ex.Message}");
        }
    }

    // Request password change with verification code
    [HttpPost("change-password-request")]
    public async Task<ActionResult> RequestPasswordChange(PasswordChangeRequestDTO requestDTO)
    {
        var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        // Verify current password
        var passwordValid = await _unitOfWork.UserRepository.CheckPasswordAsync(user, requestDTO.CurrentPassword);
        if (!passwordValid) return Unauthorized("Current password is incorrect");

        // Generate a random 6-digit code
        var verificationCode = await _unitOfWork.UserRepository.GeneratePasswordChangeCodeAsync(user);

        // Send verification email
        var emailRequest = new SendEmailRequest(
            user.Email!,
            "Password Change Verification",
            $"<h1>Verify Password Change</h1><p>Your verification code is: <strong>{verificationCode}</strong></p><p>This code will expire in 15 minutes.</p>"
        );

        var emailResult = await _emailService.SendEmailAsync(emailRequest);
        if (emailResult is BadRequestObjectResult badRequestResult)
            return BadRequest("Failed to send verification email: " + badRequestResult.Value);

        return Ok();
    }

    // Verify and complete the password change
    [HttpPost("verify-password-change")]
    public async Task<ActionResult> VerifyPasswordChange(PasswordChangeVerificationDTO verificationDTO)
    {
        var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        // Verify current password again - CORRECTED LINE BELOW
        var passwordValid = await _unitOfWork.UserRepository.CheckPasswordAsync(user, verificationDTO.CurrentPassword);
        if (!passwordValid) return Unauthorized("Current password is incorrect");

        // Verify the code
        var codeValid = await _unitOfWork.UserRepository.VerifyPasswordChangeCodeAsync(user, verificationDTO.VerificationCode);
        if (!codeValid) return BadRequest("Invalid or expired verification code");

        // Change the password
        var token = await _unitOfWork.UserRepository.GeneratePasswordResetTokenAsync(user);
        var result = await _unitOfWork.UserRepository.ResetPasswordAsync(user, token, verificationDTO.NewPassword);

        if (!result.Succeeded)
            return BadRequest("Failed to change password: " + string.Join(", ", result.Errors.Select(e => e.Description)));

        return Ok();
    }

    // Get user statistics
    [HttpGet("stats")]
    public ActionResult<UserStatsDTO> GetUserStats()
    {
        var username = User.GetUsername();

        var stats = new UserStatsDTO
        {
            Created = 0,
            Completed = 0,
            Answered = 0
        };

        return stats;
    }

    // Add user photo
    [HttpPost("add-photo")]
    public async Task<ActionResult<PhotoDTO>> AddPhoto(IFormFile file)
    {
        var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        // Use the photo service to upload
        var result = await _photoService.AddPhotoAsync(file);

        if (result.Error != null) return BadRequest(result.Error.Message);

        // Create a new photo entity
        var photo = new Photo
        {
            Url = result.SecureUrl.AbsoluteUri,
            PublicId = result.PublicId
        };

        // If this is the user's first photo, make it the main profile photo
        if (user.Photo == null)
        {
            user.Photo = photo;
        }

        // Save to database
        await _unitOfWork.UserRepository.UpdateAsync(user);

        if (await _unitOfWork.Complete())
        {
            // Create a DTO to return
            return new PhotoDTO
            {
                Id = photo.Id,
                Url = photo.Url
            };
        }

        return BadRequest("Problem adding photo");
    }

    // Delete user photo
    [HttpDelete("delete-photo/{photoId}")]
    public async Task<ActionResult> DeletePhoto(int photoId)
    {
        var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        if (user == null) return NotFound();

        // Check if the photo belongs to the user
        if (user.Photo != null && user.Photo.Id == photoId)
        {
            // If it has a public ID (Cloudinary), delete it from there
            if (!string.IsNullOrEmpty(user.Photo.PublicId))
            {
                var result = await _photoService.DeletePhotoAsync(user.Photo.PublicId);
                if (result.Error != null) return BadRequest(result.Error.Message);
            }

            // Remove photo from user
            user.Photo = null;

            await _unitOfWork.UserRepository.UpdateAsync(user);

            if (await _unitOfWork.Complete()) return Ok();
        }

        return BadRequest("Failed to delete photo");
    }

}