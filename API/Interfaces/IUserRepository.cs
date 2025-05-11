using System.Linq.Expressions;
using API.DTO;
using API.DTOs;
using API.Entities;
using API.Helpers;
using Microsoft.AspNetCore.Identity;

namespace API.Interfaces;

public interface IUserRepository
{
    Task<IdentityResult> CreateAsync(AppUser user, string password);
    Task<IdentityResult> UpdateAsync(AppUser user); 
    Task<IdentityResult> DeleteAsync(AppUser user);
    Task<MemberDTO?> GetMemberAsync(string username);
    Task<AppUser?> GetUserByIdAsync(int id, bool refreshTokens = false, bool includePostsAndComments = false, bool includePhoto = false);
    Task<string> GenerateEmailConfirmationTokenAsync(AppUser user);
    Task<IEnumerable<AppUser>> GetUsersAsync(bool includePostsAndComments = false, bool includePhoto = false);
    Task<bool> IsEmailConfirmedAsync(AppUser user);
    Task<IList<string>> GetUserRolesAsync(AppUser user);
    Task<AppUser?> GetUserByUsernameAsync(string username);
    Task<AppUser?> GetUserByEmailAsync(string email);
    Task<bool> IsUsernameTakenAsync(string username);
    Task<bool> IsEmailTakenAsync(string email);
    Task<IdentityResult> ConfirmEmailAsync(AppUser user, string token);
    Task<bool> CheckPasswordAsync(AppUser user, string password);
    Task<string> GenerateEmailVerificationCodeAsync(AppUser user);
    Task<bool> VerifyEmailVerificationCodeAsync(AppUser user, string code);
    
}