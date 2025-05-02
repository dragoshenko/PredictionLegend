namespace API.DTOs;

public class LoginDTO
{
    // username or email for login
    public required string UsernameOrEmail { get; set; }
    public required string Password { get; set; }
}