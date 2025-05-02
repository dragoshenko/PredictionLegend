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

    public async Task<AppUser?> GetUserByUsernameOrEmailAsync(string usernameOrEmail, bool refreshTokens, bool includePostsAndComments = false, bool includePhoto = false)
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
        var foundEmail = await query.SingleOrDefaultAsync(x => x.Email == usernameOrEmail);
        var foundUsername = await query.SingleOrDefaultAsync(x => x.UserName == usernameOrEmail);

        return foundEmail ?? foundUsername;
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
}