using API.DTO;
using API.DTOs;
using API.Entities;
using API.Extensions;
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

    public UserController(IUnitOfWork unitOfWork, ITokenService tokenService, IPhotoService photoService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _photoService = photoService;
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
            DisplayName = user.DisplayName,
            Token = token,
            RefreshToken = null, // Don't need to generate a refresh token here
            PhotoUrl = user.Photo?.Url,
            EmailConfirmed = user.EmailConfirmed,
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

        // Update user properties
        if (!string.IsNullOrEmpty(memberUpdateDTO.DisplayName))
            user.DisplayName = memberUpdateDTO.DisplayName;
        
        if (!string.IsNullOrEmpty(memberUpdateDTO.Bio))
            user.Bio = memberUpdateDTO.Bio;

        // Save changes
        var result = await _unitOfWork.UserRepository.UpdateAsync(user);
        
        if (!result.Succeeded) return BadRequest("Failed to update user");
        
        // Only update completed if changes done
        if (await _unitOfWork.Complete()) return NoContent();
        
        return BadRequest("Failed to update user");
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