namespace API.DTOs
{
    public class UserDTO
    {
        public int Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string DisplayName { get; set; }
        public required string Token { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime RefreshTokenExpiry { get; set; }
        public string? PhotoUrl { get; set; }
        public bool EmailConfirmed { get; set; } = false;
        public bool WasWarnedAboutPasswordChange { get; set; } = true;
        public bool HasChangedGenericPassword { get; set; } = true;
        public DateTime CreatedAt { get; set; }

    }
}