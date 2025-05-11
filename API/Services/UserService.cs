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

public class UserService(IUnitOfWork unitOfWork, ITokenService tokenService, IMapper mapper) : IUserService
{
    
}