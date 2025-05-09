using System;
using API.DTO;
using API.DTOs;
using API.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using API.Extensions;
namespace API.Controllers;

public class TokenController(IUnitOfWork unitOfWork, ITokenService tokenService) : BaseAPIController
{

     [HttpPost("refresh-token")]
    public async Task<ActionResult<UserDTO>> RefreshToken(RefreshTokenDTO refreshTokenDTO)
    {
        var userDTO = await tokenService.RefreshToken(refreshTokenDTO);
        if(userDTO.Value == null) 
        {
            return Unauthorized("Invalid token");
        }
        return userDTO.Value;
    }

    [Authorize]
    [HttpPost("revoke-token")]
    public async Task<ActionResult> RevokeToken(RevokeTokenDTO revokeTokenDTO)
    {   
        var user = await unitOfWork.UserRepository.GetUserByUsernameAsync(User.GetUsername());

        if(user == null) 
        {
            return BadRequest("Invalid credentials");
        }

        if(string.IsNullOrEmpty(revokeTokenDTO.Token))
        {
            if(user.RefreshTokens != null)
            {
                foreach(var token in user.RefreshTokens)
                {
                    token.IsActive = false;
                    token.Revoked = DateTime.UtcNow;
                }

                await unitOfWork.UserRepository.UpdateAsync(user);
            }
            return Ok();
        }

        var refreshToken = user.RefreshTokens?.FirstOrDefault(rt => 
            rt.Token == revokeTokenDTO.Token && 
            rt.IsActive && 
            rt.Expires > DateTime.UtcNow);

        if(refreshToken == null) return BadRequest("Invalid credentials");

        refreshToken.IsActive = false;
        refreshToken.Revoked = DateTime.UtcNow;
        await unitOfWork.UserRepository.UpdateAsync(user);

        return Ok();
    }

}
