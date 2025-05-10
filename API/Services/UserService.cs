using System;
using System.Security.Cryptography;
using System.Text;
using API.DTO;
using API.DTOs;
using API.Entities;
using API.Helpers;
using API.Interfaces;
using AutoMapper;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Services;

public class UserService(IUnitOfWork unitOfWork, ITokenService tokenService, IMapper mapper, IEmailService emailService, IConfiguration config) : IUserService
{
    public Task<bool> ValidateUserCredentialsAsync(AppUser user, string password)
    {
        return unitOfWork.UserRepository.CheckPasswordAsync(user, password);
    }
    public async Task<ActionResult<RegisterResponseDTO>> RegisterUser(RegisterDTO registerDTO)
    {
        var existingUser = await GetUserByUsernameOrEmailAsync(registerDTO.Username!, registerDTO.Email!);

        if(existingUser != null)
        {
            if(existingUser.UserName == registerDTO.Username && existingUser.Email != registerDTO.Email)
            {
                return new BadRequestObjectResult("Username is already taken");
            }
            if(existingUser.UserName != registerDTO.Username && existingUser.Email == registerDTO.Email)
            {
                return new BadRequestObjectResult("Email is already taken");
            }
            if(existingUser.UserName == registerDTO.Username && existingUser.Email == registerDTO.Email)
            {
                return new RegisterResponseDTO {
                    IsRegistered = true,
                    RequiresEmailConfirmation = existingUser.EmailConfirmed == false,
                };
            }

        }

        var user = mapper.Map<AppUser>(registerDTO);
        var createResult = await unitOfWork.UserRepository.CreateAsync(user, registerDTO.Password!);
        if(createResult.Succeeded == false)
        {
            return new BadRequestObjectResult("Problem creating user account");
        }

        var emailToken = await unitOfWork.UserRepository.GenerateEmailConfirmationTokenAsync(user);
        SendEmailRequest sendEmailRequest = new SendEmailRequest(user.Email!, 
            "Confirm your email", 
            $"<h1>Confirm your email</h1><p>Click <a href='{config["APIUrl"]}/account/confirm-email?id={user.Id}&token={emailToken}'>here</a> to confirm your email.</p>"
        );
        var emailResult = await emailService.SendEmailAsync(sendEmailRequest);

        if(emailResult is BadRequestObjectResult badRequestResult)
        {
            return new BadRequestObjectResult("Problem sending email confirmation link: " + badRequestResult.Value);
        }

        return new RegisterResponseDTO
        {
            IsRegistered = false,
            RequiresEmailConfirmation = true
        };
    }
    public async Task<ActionResult<UserDTO>> LoginUser(LoginDTO loginDTO)
    {

        if(string.IsNullOrEmpty(loginDTO.UsernameOrEmail) || string.IsNullOrEmpty(loginDTO.Password))
        {
            return new BadRequestObjectResult("Invalid credentials");
        }

        var userByUsername = await unitOfWork.UserRepository.GetUserByUsernameAsync(loginDTO.UsernameOrEmail!);
        var userByEmail = await unitOfWork.UserRepository.GetUserByEmailAsync(loginDTO.UsernameOrEmail!);

        if(userByUsername != null && userByEmail != null)
        {
            return new BadRequestObjectResult("Invalid credentials");
        }

        var user = userByUsername ?? userByEmail;
        if(user == null)
        {
            return new BadRequestObjectResult("Invalid credentials");
        }

        var result = await unitOfWork.UserRepository.CheckPasswordAsync(user, loginDTO.Password);
        if(result == false)
        {
            return new UnauthorizedObjectResult("Invalid credentials");
        }

        var emailConfirmed = await unitOfWork.UserRepository.IsEmailConfirmedAsync(user);
        if(emailConfirmed == false)
        {
            var emailToken = await unitOfWork.UserRepository.GenerateEmailConfirmationTokenAsync(user);
            SendEmailRequest sendEmailRequest = new SendEmailRequest(user.Email!, 
                "Email confirmation code", 
                $"<h1>Confirm your email</h1><p>Here is your email confirmation code {emailToken}</p><p>Use this code to confirm your email.</p>"
            );
            var emailServiceResult = await emailService.SendEmailAsync(sendEmailRequest);
            if (emailServiceResult is BadRequestObjectResult)
            {
                return new BadRequestObjectResult("Problem sending email confirmation link");
            }
            return new UnauthorizedObjectResult("Email not confirmed. Check your email for confirmation link.");
        }


        var token = await tokenService.CreateToken(user);
        var refreshToken = tokenService.CreateRefreshToken();
        user.RefreshTokens.Add(refreshToken);
        tokenService.ManageUserRefreshToken(user, config);


        await unitOfWork.UserRepository.UpdateAsync(user);

        return new UserDTO
        {
            Username = user.UserName!,
            DisplayName = user.DisplayName,
            Token = token,
            RefreshToken = refreshToken.Token,
            PhotoUrl = user.Photo?.Url,
            EmailConfirmed = user.EmailConfirmed,
        };
    }
    public async Task<ActionResult<UserDTO>> GoogleAuth(GoogleDTO goolgeDTO)
    {
        var validationSettings = new GoogleJsonWebSignature.ValidationSettings()
        {
            Audience = [config["Authentication:Google:ClientId"]]
        };
        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(goolgeDTO.IdToken, validationSettings);
        }
        catch (Exception)
        {
            return new UnauthorizedObjectResult("Invalid credentials");
        }
        if(payload == null)
        {
            return new UnauthorizedObjectResult("Invalid credentials");
        }
        var user = await GetUserByUsernameOrEmailAsync(null!, payload.Email!);
        if(user == null)
        {
            user = new AppUser
            {
                UserName = payload.Name,
                DisplayName = payload.Name,
                Email = payload.Email,
                EmailConfirmed = true,
            };
            var result = await unitOfWork.UserRepository.CreateAsync(user, null!);
            if(result.Succeeded == false) 
            {
                return new BadRequestObjectResult("Problem creating user account " + result.Errors.Select(x => x.Description).ToList());
            }
        }
        if(user.RefreshTokens == null)
        {
            user.RefreshTokens = new List<RefreshToken>();
        }
        var refreshToken = tokenService.CreateRefreshToken();
        user.RefreshTokens.Add(refreshToken);
        tokenService.ManageUserRefreshToken(user, config);
        await unitOfWork.UserRepository.UpdateAsync(user);
        var token = await tokenService.CreateToken(user);

        return new UserDTO
        {
            Username = user.UserName!,
            DisplayName = user.DisplayName,
            Token = token,
            RefreshToken = refreshToken.Token,
            PhotoUrl = user.Photo?.Url,
            EmailConfirmed = user.EmailConfirmed,
        };
    }
    public async Task<ActionResult> ConfirmEmailAsync(EmailConfirmationDTO emailConfirmationDTO)
    {
        var user = await unitOfWork.UserRepository.GetUserByIdAsync(emailConfirmationDTO.Id, false, false, false);
        if(user == null)
        {
            return new BadRequestObjectResult("Invalid credentials");
        }
        var result = await unitOfWork.UserRepository.ConfirmEmailAsync(user, emailConfirmationDTO.Token);
        if(result.Succeeded == false)
        {
            return new BadRequestObjectResult("Problem confirming email");
        }
        return new OkObjectResult("Email confirmed successfully");
    }


    private async Task<AppUser?> GetUserByUsernameOrEmailAsync(string? username, string? email)
    {
        AppUser? user;
        if(!string.IsNullOrEmpty(username))
        {
            user = await unitOfWork.UserRepository.GetUserByUsernameAsync(username);
            if(user != null)
            {
                return user;
            }
        }
        if(!string.IsNullOrEmpty(email))
        {
            user = await unitOfWork.UserRepository.GetUserByEmailAsync(email);
            return user;
        }
        return null;
    }
}