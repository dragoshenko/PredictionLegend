using Microsoft.AspNetCore.Mvc;
using API.DTOs;
using API.DTO;
using API.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
namespace API.Controllers;
public class AccountController(IUserService userService): BaseAPIController
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponseDTO>> Register(RegisterDTO registerDTO)
    {
        var registerRespone = await userService.RegisterUser(registerDTO);
        return registerRespone;

    }

    [HttpGet("confirm-email")]
    public async Task<ActionResult<bool>> ConfirmEmail(EmailConfirmationDTO emailConfirmationDTO)
    {

        var confirmEmailResponse = await userService.ConfirmEmailAsync(emailConfirmationDTO);
        return confirmEmailResponse;

    }

    [HttpPost("verify-email")]
public async Task<ActionResult<bool>> VerifyEmail(EmailVerificationDTO verificationDTO)
{
    var result = await userService.VerifyEmailAsync(verificationDTO);
    return result;
}

[HttpPost("resend-verification-code")]
public async Task<ActionResult> ResendVerificationCode([FromBody] ResendVerificationCodeDTO request)
{
    var result = await userService.ResendVerificationCodeAsync(request);
    return result;
}

    [HttpPost("login")]
    public async Task<ActionResult<UserDTO>> Login(LoginDTO loginDTO)
    {
        var loginResponse = await userService.LoginUser(loginDTO);
        return loginResponse;
    }

     [HttpGet("google-login")]
    public IActionResult GoogleLogin()
    {
        var props = new AuthenticationProperties
        {
            RedirectUri = Url.Action(nameof(GoogleResponse))
        };
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("google-response")]
    public async Task<IActionResult> GoogleResponse()
    {

        var result = await HttpContext.AuthenticateAsync(
            CookieAuthenticationDefaults.AuthenticationScheme);

        if (!result.Succeeded)
            return BadRequest("Google authentication failed");

        var idToken = result.Properties.GetTokenValue("id_token");
        if (string.IsNullOrEmpty(idToken))
            return BadRequest("No ID token");

        var googleDTO = new GoogleDTO { IdToken = idToken };
        var actionResult = await userService.GoogleAuth(googleDTO);

        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return actionResult.Result!;
    }
}