using System;
using System.Security.Claims;
using API.DTO;
using API.DTOs;
using API.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface ITokenService
{
    Task<string> CreateToken(AppUser user);
    Task<ActionResult<UserDTO?>> RefreshToken(RefreshTokenDTO refreshTokenDTO);
    string GenerateRefreshToken();
    RefreshToken CreateRefreshToken();
    ClaimsPrincipal GetClaimsPrincipalFromExpiredToken(string token);
    void ManageUserRefreshToken(AppUser user, IConfiguration config);
}
