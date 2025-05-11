using Microsoft.AspNetCore.Mvc;
using API.DTOs;
using API.DTO;
using API.Services;
using API.Interfaces;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication;
namespace API.Controllers;
public class AccountController(IAuthService authenticationService) : BaseAPIController
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponseDTO>> Register(RegisterDTO registerDTO)
    {
        var registerRespone = await authenticationService.RegisterUser(registerDTO);
        return registerRespone;

    }

    [HttpGet("confirm-email")]
    public async Task<ActionResult<bool>> ConfirmEmail(EmailConfirmationDTO emailConfirmationDTO)
    {

        var confirmEmailResponse = await authenticationService.ConfirmEmailAsync(emailConfirmationDTO);
        return confirmEmailResponse;

    }

    [HttpPost("verify-email")]
    public async Task<ActionResult<bool>> VerifyEmail(EmailVerificationDTO verificationDTO)
    {
        var result = await authenticationService.VerifyEmailAsync(verificationDTO);
        return result;
    }

    [HttpPost("resend-verification-code")]
    public async Task<ActionResult> ResendVerificationCode([FromBody] ResendVerificationCodeDTO request)
    {
        var result = await authenticationService.ResendVerificationCodeAsync(request);
        return result;
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserDTO>> Login(LoginDTO loginDTO)
    {
        var loginResponse = await authenticationService.LoginUser(loginDTO);
        return loginResponse;
    }

    [HttpGet("google-login")]
    public IActionResult GoogleLogin()
    {
        var redirectUri = Url.Action(
            action: nameof(GoogleResponse),
            controller: "account",
            values: null,
            protocol: Request.Scheme,
            host: Request.Host.Value);

        var props = new AuthenticationProperties
        {
            RedirectUri = redirectUri,
            Items =
        {
            { ".xsrf", Guid.NewGuid().ToString() } // Explicit state
        }
        };

        Console.WriteLine($"[GoogleLogin] Generated State: {props.Items[".xsrf"]}");
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }
    [HttpGet("google-response")]
    public async Task<IActionResult> GoogleResponse()
    {
        var result = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
        if (!result.Succeeded)
        {
            Console.WriteLine($"[GoogleResponse] Authentication failed: {result.Failure?.Message}");
            return BadRequest("Google authentication failed");
        }

        var state = result.Properties.Items[".xsrf"];
        Console.WriteLine($"[GoogleResponse] Received State: {state}");
        if (string.IsNullOrEmpty(state))
        {
            Console.WriteLine("[GoogleResponse] State is missing");
            return BadRequest("OAuth state is missing or invalid");
        }

        var idToken = result.Properties.GetTokenValue("id_token");
        if (string.IsNullOrEmpty(idToken))
        {
            Console.WriteLine("[GoogleResponse] No ID token");
            return BadRequest("No ID token");
        }

        var googleDTO = new GoogleDTO { IdToken = idToken };
        var actionResult = await authenticationService.GoogleAuth(googleDTO);

        await HttpContext.SignOutAsync(GoogleDefaults.AuthenticationScheme);

        return actionResult.Result!;
    }
    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword(ForgotPasswordDTO forgotPasswordDTO)
    {
        return await authenticationService.ForgotPasswordAsync(forgotPasswordDTO);
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword(ResetPasswordDTO resetPasswordDTO)
    {
        return await authenticationService.ResetPasswordAsync(resetPasswordDTO);
    }
}
