using System;
using API.DTO;
using API.Entities;
using API.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace API.Interfaces;

public interface IEmailService
{
    Task<IActionResult> SendEmailAsync(SendEmailRequest sendEmailRequest);
}
