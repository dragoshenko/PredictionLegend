using API.DTO;
using API.DTOs;
using API.Entities;
using API.Extensions;
using API.Helpers;
using API.Interfaces;
using Microsoft.AspNetCore.Authorization;
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

    public UserController(
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        IPhotoService photoService,
        IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _photoService = photoService;
        _emailService = emailService;
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
        if (!string.IsNullOrEmpty(memberUpdateDTO.Bio))
            user.Bio = memberUpdateDTO.Bio;

        // Save changes
        var result = await _unitOfWork.UserRepository.UpdateAsync(user);

        if (!result.Succeeded) return BadRequest("Failed to update user profile");

        // Only update completed if changes done
        if (await _unitOfWork.Complete())
        {
            // Return the updated user info
            return Ok(new
            {
                displayName = user.DisplayName,
                message = "Profile updated successfully"
            });
        }

        return BadRequest("Failed to update user profile");
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
    public async Task<ActionResult<UserStatsDTO>> GetUserStats()
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
    [HttpPost("add-password")]
    public async Task<ActionResult> AddPassword([FromBody] AddPasswordDTO addPasswordDTO)
    {
        var user = await _unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());
        
        if (user == null) return NotFound();
        
        // Generate a reset token
        var token = await _unitOfWork.UserRepository.GeneratePasswordResetTokenAsync(user);
        
        // Set the new password
        var result = await _unitOfWork.UserRepository.ResetPasswordAsync(user, token, addPasswordDTO.NewPassword);
        
        if (!result.Succeeded)
            return BadRequest("Failed to add password: " + string.Join(", ", result.Errors.Select(e => e.Description)));
        
        // Update user properties
        user.HasChangedGenericPassword = true;
        await _unitOfWork.UserRepository.UpdateAsync(user);
        await _unitOfWork.Complete();
        
        return Ok(new { message = "Password added successfully" });
    }
}