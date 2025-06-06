using System;
using API.DTO;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using PasswordGenerator;

namespace API.Services;

public class AuthService(IUnitOfWork unitOfWork, ITokenService tokenService, IMapper mapper, IEmailService emailService, IConfiguration config, UserManager<AppUser> userManager) : IAuthService
{
    public Task<bool> ValidateUserCredentialsAsync(AppUser user, string password)
    {
        return unitOfWork.UserRepository.CheckPasswordAsync(user, password);
    }
    public async Task<ActionResult<RegisterResponseDTO>> RegisterUser(RegisterDTO registerDTO)
    {
        var existingUser = await GetUserByUsernameOrEmailAsync(registerDTO.Username!, registerDTO.Email!);

        if (existingUser != null)
        {
            if (existingUser.UserName == registerDTO.Username && existingUser.Email != registerDTO.Email)
            {
                return new BadRequestObjectResult("Username is already taken");
            }
            if (existingUser.UserName != registerDTO.Username && existingUser.Email == registerDTO.Email)
            {
                return new BadRequestObjectResult("Email is already taken");
            }
            if (existingUser.UserName == registerDTO.Username && existingUser.Email == registerDTO.Email)
            {
                return new RegisterResponseDTO
                {
                    IsRegistered = true,
                    RequiresEmailConfirmation = existingUser.EmailConfirmed == false,
                    UserId = existingUser.Id
                };
            }

        }

        var user = mapper.Map<AppUser>(registerDTO);
        var createResult = await unitOfWork.UserRepository.CreateAsync(user, registerDTO.Password!);
        if (createResult.Succeeded == false)
        {
            return new BadRequestObjectResult("Problem creating user account");
        }
        var addToRoleResult = await userManager.AddToRoleAsync(user, "Member");
        if(addToRoleResult.Succeeded == false)
        {
            return new BadRequestObjectResult("Problem adding user to role");
        }
        // Generate a 6-digit verification code instead of a token
        var verificationCode = await unitOfWork.UserRepository.GenerateEmailVerificationCodeAsync(user);

        // Send email with verification code
        SendEmailRequest sendEmailRequest = new SendEmailRequest(
            user.Email!,
            "Verify Your Email",
            $"<h1>Verify Your Email</h1><p>Your verification code is: <strong>{verificationCode}</strong></p><p>This code will expire in 15 minutes.</p>"
        );

        var emailResult = await emailService.SendEmailAsync(sendEmailRequest);

        if (emailResult is BadRequestObjectResult badRequestResult)
        {
            return new BadRequestObjectResult("Problem sending email confirmation link: " + badRequestResult.Value);
        }

        return new RegisterResponseDTO
        {
            IsRegistered = false,
            RequiresEmailConfirmation = true,
            UserId = user.Id
        };
    }
    public async Task<ActionResult<UserDTO>> LoginUser(LoginDTO loginDTO)
    {

        if (string.IsNullOrEmpty(loginDTO.UsernameOrEmail) || string.IsNullOrEmpty(loginDTO.Password))
        {
            return new BadRequestObjectResult("Invalid credentials");
        }

        var userByUsername = await unitOfWork.UserRepository.GetUserByUsernameAsync(loginDTO.UsernameOrEmail!);
        var userByEmail = await unitOfWork.UserRepository.GetUserByEmailAsync(loginDTO.UsernameOrEmail!);

        if (userByUsername != null && userByEmail != null)
        {
            return new BadRequestObjectResult("Invalid credentials");
        }

        var user = userByUsername ?? userByEmail;
        if (user == null)
        {
            return new BadRequestObjectResult("Invalid credentials");
        }

        var result = await unitOfWork.UserRepository.CheckPasswordAsync(user, loginDTO.Password);
        if (result == false)
        {
            return new UnauthorizedObjectResult("Invalid credentials");
        }

        var emailConfirmed = await unitOfWork.UserRepository.IsEmailConfirmedAsync(user);
        if (emailConfirmed == false)
        {
            // Use the 6-digit code method instead of token
            var verificationCode = await unitOfWork.UserRepository.GenerateEmailVerificationCodeAsync(user);

            SendEmailRequest sendEmailRequest = new SendEmailRequest(user.Email!,
                "Email Verification Code",
                $"<h1>Verify Your Email</h1><p>Your verification code is: <strong>{verificationCode}</strong></p><p>This code will expire in 15 minutes.</p>"
            );

            var emailServiceResult = await emailService.SendEmailAsync(sendEmailRequest);
            if (emailServiceResult is BadRequestObjectResult)
            {
                return new BadRequestObjectResult("Problem sending verification code");
            }

            // Return unauthorized with user ID for verification
            return new UnauthorizedObjectResult(new
            {
                message = "Email not confirmed. Check your email for verification code.",
                userId = user.Id
            });
        }

        var token = await tokenService.CreateToken(user);
        var refreshToken = tokenService.CreateRefreshToken();
        user.RefreshTokens.Add(refreshToken);
        tokenService.ManageUserRefreshToken(user, config);


        await unitOfWork.UserRepository.UpdateAsync(user);

        return new UserDTO
        {
            Username = user.UserName!,
            Email = user.Email!,
            DisplayName = user.DisplayName,
            Token = token,
            RefreshToken = refreshToken.Token,
            PhotoUrl = user.Photo?.Url,
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt
        };
    }
    public async Task<ActionResult<UserDTO>> GoogleAuth(GoogleDTO googleDTO)
    {
        try
        {
            var clientId = config["Authentication:Google:ClientId"];
            if (string.IsNullOrEmpty(clientId))
            {
                Console.WriteLine("Google Client ID is missing in configuration");
                return new StatusCodeResult(500);
            }

            var validationSettings = new GoogleJsonWebSignature.ValidationSettings()
            {
                Audience = new List<string> { clientId }
            };
            
            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(googleDTO.IdToken, validationSettings);
                Console.WriteLine($"Successfully validated Google token for: {payload.Email}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Google token validation error: {ex.Message}");
                return new UnauthorizedObjectResult("Invalid Google credentials");
            }
            
            if (payload == null)
            {
                Console.WriteLine("Google payload is null after validation");
                return new UnauthorizedObjectResult("Invalid Google credentials");
            }
            
            if (string.IsNullOrEmpty(payload.Email))
            {
                Console.WriteLine("Google payload does not contain email");
                return new UnauthorizedObjectResult("Email is required for Google authentication");
            }
            
            // Try to find user by email
            var user = await unitOfWork.UserRepository.GetUserByEmailAsync(payload.Email);
            
            // Create new user if not found
            if (user == null)
            {
                Console.WriteLine($"Creating new user for Google login with email: {payload.Email}");
                
                // Create a username from email if name is not available
                string username = payload.Name;
                if (string.IsNullOrEmpty(username))
                {
                    username = payload.Email.Split('@')[0];
                }
                
                // Remove spaces from username
                username = username.Replace(" ", "");
                
                // Handle display name - use given name + family name, or just email prefix if not available
                string displayName = payload.Name;
                if (string.IsNullOrEmpty(displayName))
                {
                    displayName = payload.Email.Split('@')[0];
                }
                
                user = new AppUser
                {
                    UserName = username,
                    DisplayName = displayName,
                    Email = payload.Email,
                    EmailConfirmed = true,
                    HasChangedGenericPassword = false,
                    WasWarnedAboutPasswordChange = false,
                    CreatedAt = DateTime.UtcNow
                };
                
                // Generate a random password
                var passwordGenerator = new Password(includeLowercase: true, includeUppercase: true, includeNumeric: true, includeSpecial: true, passwordLength: 16);
                var password = passwordGenerator.Next();
                
                // Create the user
                var result = await unitOfWork.UserRepository.CreateAsync(user, password);
                
                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    Console.WriteLine($"Failed to create user account: {errors}");
                    return new BadRequestObjectResult($"Problem creating user account: {errors}");
                }
            }
            
            // Initialize refresh tokens list if null
            if (user.RefreshTokens == null)
            {
                user.RefreshTokens = new List<RefreshToken>();
            }
            
            // Create and add refresh token
            var refreshToken = tokenService.CreateRefreshToken();
            user.RefreshTokens.Add(refreshToken);
            
            // Manage refresh tokens
            tokenService.ManageUserRefreshToken(user, config);
            
            // Update user
            var updateResult = await unitOfWork.UserRepository.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                Console.WriteLine($"Failed to update user with refresh token: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
            }
            
            // Generate JWT token
            var token = await tokenService.CreateToken(user);
            
            Console.WriteLine($"Google authentication successful for user: {user.UserName}");
            
            // Return user DTO
            return new UserDTO
            {
                Username = user.UserName!,
                Email = user.Email!,
                DisplayName = user.DisplayName,
                Token = token,
                RefreshToken = refreshToken.Token,
                PhotoUrl = user.Photo?.Url,
                EmailConfirmed = user.EmailConfirmed,
                WasWarnedAboutPasswordChange = user.WasWarnedAboutPasswordChange,
                HasChangedGenericPassword = user.HasChangedGenericPassword,
                CreatedAt = user.CreatedAt
            };
        }
        catch (Exception ex)
        {
            // Log the full exception details
            Console.WriteLine($"Unexpected error in GoogleAuth: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            
            // Return a 500 error with minimal information
            return new StatusCodeResult(500);
        }
    }
    public async Task<ActionResult> ConfirmEmailAsync(EmailConfirmationDTO emailConfirmationDTO)
    {
        var user = await unitOfWork.UserRepository.GetUserByIdAsync(emailConfirmationDTO.Id, false, false, false);
        if (user == null)
        {
            return new BadRequestObjectResult("Invalid credentials");
        }
        var result = await unitOfWork.UserRepository.ConfirmEmailAsync(user, emailConfirmationDTO.Token);
        if (result.Succeeded == false)
        {
            return new BadRequestObjectResult("Problem confirming email");
        }
        return new OkObjectResult("Email confirmed successfully");
    }
    public async Task<ActionResult<bool>> VerifyEmailAsync(EmailVerificationDTO verificationDTO)
    {
        var user = await unitOfWork.UserRepository.GetUserByIdAsync(verificationDTO.Id, false, false, false);
        if (user == null)
        {
            return new BadRequestObjectResult("Invalid user ID");
        }

        var result = await unitOfWork.UserRepository.VerifyEmailVerificationCodeAsync(user, verificationDTO.Code);
        if (!result)
        {
            return new BadRequestObjectResult("Invalid or expired verification code");
        }

        return new OkObjectResult(true);
    }

    public async Task<ActionResult> ResendVerificationCodeAsync(ResendVerificationCodeDTO resendDTO)
    {
        var user = await unitOfWork.UserRepository.GetUserByIdAsync(resendDTO.UserId, false, false, false);
        if (user == null)
        {
            return new BadRequestObjectResult("Invalid user ID");
        }

        // Generate a new verification code
        var verificationCode = await unitOfWork.UserRepository.GenerateEmailVerificationCodeAsync(user);

        // Send a new email
        SendEmailRequest sendEmailRequest = new SendEmailRequest(
            user.Email!,
            "Verify Your Email",
            $"<h1>Verify Your Email</h1><p>Your new verification code is: <strong>{verificationCode}</strong></p><p>This code will expire in 15 minutes.</p>"
        );

        var emailResult = await emailService.SendEmailAsync(sendEmailRequest);
        if (emailResult is BadRequestObjectResult badRequestResult)
        {
            return new BadRequestObjectResult("Problem sending verification code: " + badRequestResult.Value);
        }

        return new OkResult();
    }

    private async Task<AppUser?> GetUserByUsernameOrEmailAsync(string? username, string? email)
    {
        AppUser? user;
        if (!string.IsNullOrEmpty(username))
        {
            user = await unitOfWork.UserRepository.GetUserByUsernameAsync(username);
            if (user != null)
            {
                return user;
            }
        }
        if (!string.IsNullOrEmpty(email))
        {
            user = await unitOfWork.UserRepository.GetUserByEmailAsync(email);
            return user;
        }
        return null;
    }
    public async Task<ActionResult> ForgotPasswordAsync(ForgotPasswordDTO forgotPasswordDTO)
    {
        // Find user by email
        var user = await unitOfWork.UserRepository.GetUserByEmailAsync(forgotPasswordDTO.Email);
        if (user == null)
        {
            // Return success even if user not found for security reasons
            return new OkObjectResult(new { message = "If your email is registered, you will receive a password reset code" });
        }

        // Generate a 6-digit verification code
        var resetCode = await unitOfWork.UserRepository.GeneratePasswordResetCodeAsync(user);

        // Send the code via email
        SendEmailRequest sendEmailRequest = new SendEmailRequest(
            user.Email!,
            "Reset Your Password",
            $"<h1>Reset Your Password</h1><p>Your password reset code is: <strong>{resetCode}</strong></p><p>This code will expire in 15 minutes.</p>"
        );

        var emailResult = await emailService.SendEmailAsync(sendEmailRequest);
        if (emailResult is BadRequestObjectResult badRequestResult)
        {
            Console.WriteLine($"Error sending password reset email: {badRequestResult.Value}");
        }

        return new OkObjectResult(new { message = "If your email is registered, you will receive a password reset code" });
    }

    public async Task<ActionResult> ResetPasswordAsync(ResetPasswordDTO resetPasswordDTO)
    {
        // Find user by email
        var user = await unitOfWork.UserRepository.GetUserByEmailAsync(resetPasswordDTO.Email);
        if (user == null)
        {
            return new BadRequestObjectResult("Invalid reset request");
        }

        // Verify the reset code
        var isCodeValid = await unitOfWork.UserRepository.VerifyPasswordResetCodeAsync(user, resetPasswordDTO.Code);
        if (!isCodeValid)
        {
            return new BadRequestObjectResult("Invalid or expired reset code");
        }

        // Reset the password
        var token = await unitOfWork.UserRepository.GeneratePasswordResetTokenAsync(user);
        var result = await unitOfWork.UserRepository.ResetPasswordAsync(user, token, resetPasswordDTO.NewPassword);

        if (!result.Succeeded)
        {
            return new BadRequestObjectResult("Failed to reset password: " + string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        return new OkObjectResult(new { message = "Password has been reset successfully" });
    }

    public async Task<ActionResult> WasWarnedAboutPasswordChange(int userId)
    {
        var user = await unitOfWork.UserRepository.GetUserByIdAsync(userId, false, false, false);
        if (user == null)
        {
            return new BadRequestObjectResult("Invalid user ID");
        }

        user.WasWarnedAboutPasswordChange = true;
        await unitOfWork.UserRepository.UpdateAsync(user);
        await unitOfWork.Complete();

        return new OkObjectResult("User was warned about password change");
    }
}
