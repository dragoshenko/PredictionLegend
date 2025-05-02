using Microsoft.AspNetCore.Mvc;
using API.DTOs;
using API.DTO;
using API.Services;
namespace API.Controllers;
public class AccountController(IUserService userService):BaseAPIController
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponseDTO>> Register(RegisterDTO registerDTO)
    {
        var registerRespone = await userService.RegisterUser(registerDTO);
        if(registerRespone.Value == null) 
        {
            return BadRequest("Problem creating user account");
        }
        
        return registerRespone.Value;

    }

    [HttpGet("confirm-email")]
    public async Task<ActionResult> ConfirmEmail(EmailConfirmationDTO emailConfirmationDTO)
    {

        var result = await userService.ConfirmEmailAsync(emailConfirmationDTO);

        if(result == false) 
        {
            return BadRequest("Problem confirming email");
        }

        return Ok( new { message = "Email confirmed" });

    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDTO>> Login(LoginDTO loginDTO)
    {
        var userDTO = await userService.LoginUser(loginDTO);
        if(userDTO.Value == null) 
        {
            return Unauthorized("Invalid credentials");
        }
        return userDTO.Value;
    }

    [HttpPost("google-auth")]
    public async Task<ActionResult<UserDTO>> GoogleAuth(GoogleDTO googleDTO)
    {
        var userDTO = await userService.GoogleAuth(googleDTO);
        if(userDTO.Value == null) 
        {
            return Unauthorized("Invalid credentials");
        }
        return userDTO.Value;
    }
}