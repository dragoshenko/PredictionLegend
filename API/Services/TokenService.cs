using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using API.DTO;
using API.DTOs;
using API.Entities;
using API.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace API.Services;

public class TokenService(IUnitOfWork unitOfWork, IConfiguration config) : ITokenService
{
    public async Task<string> CreateToken(AppUser user)
    {

        if(user == null) throw new ArgumentException("User is null");

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.NameId, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.UserName!)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["TokenKey"] ?? throw new Exception("Token key is missing")));

        var roles = await unitOfWork.UserRepository.GetUserRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(30),
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    public async Task<ActionResult<UserDTO?>> RefreshToken(RefreshTokenDTO refreshTokenDTO)
    {
        var principal = GetClaimsPrincipalFromExpiredToken(refreshTokenDTO.Token);
        if(principal == null || principal.Identity == null || principal.Identity.Name == null) 
        {
            return new UnauthorizedObjectResult("Invalid token");
        }
        var user = await unitOfWork.UserRepository.GetUserByUsernameAsync(principal.Identity.Name!);
        if(user == null)
        {
            return new UnauthorizedObjectResult("Invalid token");
        }
        var refreshToken = user.RefreshTokens?.FirstOrDefault(rt =>
            rt.Token == refreshTokenDTO.RefreshToken && 
            rt.IsActive && 
            rt.Expires > DateTime.UtcNow);

        if(refreshToken == null) 
        {
            return null!;
        }

        refreshToken.IsActive = false;
        refreshToken.Revoked = DateTime.UtcNow;

        var newRefreshToken = CreateRefreshToken();
        user.RefreshTokens?.Add(newRefreshToken);

        ManageUserRefreshToken(user, config);
        await unitOfWork.UserRepository.UpdateAsync(user);
        var token = await CreateToken(user);

        return new UserDTO
        {
            Username = user.UserName!,
            Email = user.Email!,
            DisplayName = user.DisplayName!,
            Token = token,
            RefreshToken = newRefreshToken.Token,
            PhotoUrl = user.Photo?.Url
        };
        
    }

    public string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    public RefreshToken CreateRefreshToken()
    {
        return new RefreshToken
        {
            Token = GenerateRefreshToken(),
            Created = DateTime.UtcNow,
            Expires = DateTime.UtcNow.AddDays(30),
            IsActive = true
        };
    }


    public ClaimsPrincipal GetClaimsPrincipalFromExpiredToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["TokenKey"] ?? throw new Exception("Token key is missing")));
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
        if(securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha512, StringComparison.InvariantCultureIgnoreCase))
            throw new SecurityTokenException("Invalid token");
        return principal;
    }

    public void ManageUserRefreshToken(AppUser user, IConfiguration config)
    {
        var maxActiveTokens = int.Parse(config["MaxActiveRefreshTokens"] ?? "5");
        if(user.RefreshTokens == null)
        {
            user.RefreshTokens = new List<RefreshToken>();
            return;
        }

        user.RefreshTokens.RemoveAll(rt => !rt.IsActive && rt.Revoked < DateTime.UtcNow.AddDays(-1)
            || rt.Expires < DateTime.UtcNow 
        );

        var activeTokens = user.RefreshTokens
            .Where(rt => rt.IsActive && rt.Expires > DateTime.UtcNow)
            .OrderByDescending(rt => rt.Expires)
            .ToList();
        if(activeTokens.Count > maxActiveTokens)
        {
            foreach(var token in activeTokens.Skip(maxActiveTokens))
            {
                token.IsActive = false;
                token.Revoked = DateTime.UtcNow;
            }
        }
    }
}