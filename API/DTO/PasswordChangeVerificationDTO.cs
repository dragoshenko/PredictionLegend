namespace API.DTO;

public class PasswordChangeVerificationDTO
{
    public required string CurrentPassword { get; set; }
    public required string NewPassword { get; set; }
    public required string VerificationCode { get; set; }
}