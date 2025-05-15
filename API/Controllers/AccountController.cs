using Microsoft.AspNetCore.Mvc;
using API.DTOs;
using API.DTO;
using API.Services;
using API.Interfaces;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication;
using API.Extensions;
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

    [HttpPost("google-auth")]
    public async Task<ActionResult<UserDTO>> GoogleAuth(GoogleDTO googleDTO)
    {
        var googleResponse = await authenticationService.GoogleAuth(googleDTO);
        return googleResponse;
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

    [HttpPut("was-warned-about-password-change")]
    public async Task<ActionResult> WasWarnedAboutPasswordChange()
    {
        var result = await authenticationService.WasWarnedAboutPasswordChange(User.GetUserId());
        return result;
    }
}
