namespace API.DTOs
{
    public class UserDTO
    {
        public required string Username { get; set; }
        public required string DisplayName { get; set; }
        public required string Token { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime RefreshTokenExpiry { get; set; }
        public string? PhotoUrl { get; set; }
        public bool EmailConfirmed { get; set; } = false;

    }
}