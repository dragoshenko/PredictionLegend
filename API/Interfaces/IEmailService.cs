using System;
using API.DTO;
using API.Entities;
using API.Helpers;

namespace API.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(SendEmailRequest sendEmailRequest);
}
