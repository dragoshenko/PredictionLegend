using System;
using System.Net;
using System.Net.Mail;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using API.Interfaces;
using API.DTO;
using Microsoft.Extensions.Options;
using API.Helpers;

namespace API.Services;

public class GmailService : IEmailService
{

    private readonly GoogleSettings _googleSettings;

    public GmailService(IOptions<GoogleSettings> googleSettings)
    {
        _googleSettings = googleSettings.Value;
    }

    public async Task SendEmailAsync(SendEmailRequest sendEmailRequest)
    {   
        // Add this debug check
        if (string.IsNullOrEmpty(sendEmailRequest.Recipient))
        {
            throw new ArgumentException("Recipient email is null or empty");
        }

        // If you reach here, the email is not null or empty, but might still be invalid
        try
        {
            MailMessage mailMessage = new MailMessage(_googleSettings.Gmail, sendEmailRequest.Recipient)
            {
                Subject = sendEmailRequest.Subject,
                Body = sendEmailRequest.Body,
                IsBodyHtml = true
            };

            using var smtpClient = new SmtpClient();
            smtpClient.Host = _googleSettings.SMTPServer;
            smtpClient.Port = _googleSettings.SMTPPort;
            smtpClient.Credentials = new NetworkCredential(_googleSettings.Gmail, _googleSettings.Password);
            smtpClient.EnableSsl = true; 

            await smtpClient.SendMailAsync(mailMessage);
        }
        catch (Exception ex)
        {
            // Add more specific logging for this error
            throw new Exception($"Failed to send email to '{sendEmailRequest.Recipient}'. Error: {ex.Message}", ex);
        }
    }
}