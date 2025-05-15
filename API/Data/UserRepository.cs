namespace API.Data;

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using API.DTO;
using API.Entities;
using API.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

public class UserRespository(UserManager<AppUser> userManager, IMapper mapper) : IUserRepository
{
    public async Task<IdentityResult> CreateAsync(AppUser user, string password)
    {
        return await userManager.CreateAsync(user, password);
    }

    public async Task<IdentityResult> UpdateAsync(AppUser user)
    {
        return await userManager.UpdateAsync(user);
    }

    public async Task<IdentityResult> DeleteAsync(AppUser user)
    {
        return await userManager.DeleteAsync(user);
    }

    public Task<MemberDTO?> GetMemberAsync(string username)
    {
        return userManager.Users
            .Where(x => x.UserName == username)
            .ProjectTo<MemberDTO>(mapper.ConfigurationProvider)
            .FirstOrDefaultAsync();
    }

    public async Task<string> GenerateEmailConfirmationTokenAsync(AppUser user)
    {
        return await userManager.GenerateEmailConfirmationTokenAsync(user);
    }

    public async Task<bool> IsUsernameTakenAsync(string username)
    {
        return await userManager.Users.AnyAsync(x => x.UserName == username);
    }

    public async Task<bool> IsEmailTakenAsync(string email)
    {
        return await userManager.Users.AnyAsync(x => x.Email == email);
    }
    
    public async Task<bool> IsDisplayNameTakenAsync(string displayName)
    {
        return await userManager.Users.AnyAsync(x => x.DisplayName.ToLower() == displayName.ToLower());
    }
    
    public async Task<AppUser?> GetUserByDisplayNameAsync(string displayName)
    {
        return await userManager.Users.FirstOrDefaultAsync(x => x.DisplayName.ToLower() == displayName.ToLower());
    }
    
    public async Task<AppUser?> GetUserByIdAsync(int id, bool refreshTokens = false, bool includePostsAndComments = false, bool includePhoto = false)
    {
        IQueryable<AppUser> query = userManager.Users;

        if (refreshTokens)
        {
            query = query.Include(u => u.RefreshTokens);
        }

        if (includePostsAndComments)
        {
            query = query.Include(u => u.Posts).ThenInclude(p => p.Comments);
        }

        if (includePhoto)
        {
            query = query.Include(u => u.Photo);
        }

        return await query.SingleOrDefaultAsync(x => x.Id == id);
    }

    public async Task<IEnumerable<AppUser>> GetUsersAsync(bool includePostsAndComments = false, bool includePhoto = false)
    {
        IQueryable<AppUser> query = userManager.Users;

        if (includePostsAndComments)
        {
            query = query.Include(u => u.Posts).ThenInclude(p => p.Comments);
        }

        if (includePhoto)
        {
            query = query.Include(u => u.Photo);
        }

        return await query.ToListAsync();
    }

    public async Task<AppUser?> GetUserByUsernameAsync(string username)
    {
        return await userManager.Users.SingleOrDefaultAsync(x => x.UserName == username);
    }

    public async Task<AppUser?> GetUserByEmailAsync(string email)
    {
        return await userManager.Users.SingleOrDefaultAsync(x => x.Email == email);
    }

    public async Task<IList<string>> GetUserRolesAsync(AppUser user)
    {
        return await userManager.GetRolesAsync(user);
    }

    public async Task<bool> IsEmailConfirmedAsync(AppUser user)
    {
        return await userManager.IsEmailConfirmedAsync(user);
    }

    public async Task<IdentityResult> ConfirmEmailAsync(AppUser user, string token)
    {
        return await userManager.ConfirmEmailAsync(user, token);
    }

    public async Task<bool> CheckPasswordAsync(AppUser user, string password)
    {
        return await userManager.CheckPasswordAsync(user, password);
    }

    public async Task<string> GenerateEmailVerificationCodeAsync(AppUser user)
    {
            // Generate a random 6-digit code
            var random = new Random();
            var code = random.Next(100000, 999999).ToString();
            
            var codeExists = await userManager.Users.AnyAsync(x => x.EmailVerificationCode == code);
            while (codeExists)
            {
                code = random.Next(100000, 999999).ToString();
                codeExists = await userManager.Users.AnyAsync(x => x.EmailVerificationCode == code);
            }
            
            user.EmailVerificationCode = code;
            user.EmailVerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15);
            
            // Update the user
            await userManager.UpdateAsync(user);
            
            return code;
    }
    
    public async Task<bool> VerifyEmailVerificationCodeAsync(AppUser user, string code)
    {
        // Check if code is valid and not expired
        if (user.EmailVerificationCode == code && 
            user.EmailVerificationCodeExpiry.HasValue && 
            user.EmailVerificationCodeExpiry.Value > DateTime.UtcNow)
        {
            // Clear the verification code
            user.EmailVerificationCode = null;
            user.EmailVerificationCodeExpiry = null;
            
            // Set email as confirmed
            user.EmailConfirmed = true;
            await userManager.UpdateAsync(user);
            
            return true;
        }
        
        return false;
    }
    public async Task<string> GeneratePasswordResetTokenAsync(AppUser user)
    {
        return await userManager.GeneratePasswordResetTokenAsync(user);
    }
    
    public async Task<string> GeneratePasswordResetCodeAsync(AppUser user)
    {
        // Generate a random 6-digit code
        var random = new Random();
        var code = random.Next(100000, 999999).ToString();
        var codeExists = await userManager.Users.AnyAsync(x => x.PasswordResetCode == code);
        while (codeExists)
        {
            code = random.Next(100000, 999999).ToString();
            codeExists = await userManager.Users.AnyAsync(x => x.PasswordResetCode == code);
        }
        
        user.PasswordResetCode = code;
        user.PasswordResetCodeExpiry = DateTime.UtcNow.AddMinutes(15);
        
        // Update the user
        await userManager.UpdateAsync(user);
        
        return code;
    }
    public async Task<bool> VerifyPasswordChangeCodeAsync(AppUser user, string code)
    {
        // Check if code is valid and not expired
        if (user.PasswordChangeCode == code && 
            user.PasswordChangeCodeExpiry.HasValue && 
            user.PasswordChangeCodeExpiry.Value > DateTime.UtcNow)
        {
            // Clear the verification code
            user.PasswordChangeCode = null;
            user.PasswordChangeCodeExpiry = null;
            
            // Update the user
            await UpdateAsync(user);
            
            return true;
        }
        
        return false;
    }
    public async Task<string> GeneratePasswordChangeCodeAsync(AppUser user)
    {
        // Generate a random 6-digit code
        var random = new Random();
        var code = random.Next(100000, 999999).ToString();
        var codeExists = await userManager.Users.AnyAsync(x => x.PasswordChangeCode == code);
        while (codeExists)
        {
            code = random.Next(100000, 999999).ToString();
            codeExists = await userManager.Users.AnyAsync(x => x.PasswordChangeCode == code);
        }
        // Store the code in user properties
        user.PasswordChangeCode = code;
        user.PasswordChangeCodeExpiry = DateTime.UtcNow.AddMinutes(15);
        
        // Update the user
        await UpdateAsync(user);
        
        return code;
    }
    public async Task<bool> VerifyPasswordResetCodeAsync(AppUser user, string code)
    {
        // Check if code is valid and not expired
        if (user.PasswordResetCode == code && 
            user.PasswordResetCodeExpiry.HasValue && 
            user.PasswordResetCodeExpiry.Value > DateTime.UtcNow)
        {
            // Clear the verification code
            user.PasswordResetCode = null;
            user.PasswordResetCodeExpiry = null;
            
            // Update the user
            await userManager.UpdateAsync(user);
            
            return true;
        }
        
        return false;
    }
    
    public async Task<IdentityResult> ResetPasswordAsync(AppUser user, string token, string newPassword)
    {
        return await userManager.ResetPasswordAsync(user, token, newPassword);
    }

}