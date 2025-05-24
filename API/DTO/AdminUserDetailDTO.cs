namespace API.DTO;

public class AdminUserDetailDTO
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastActive { get; set; }
    public List<string> Roles { get; set; } = [];
    public string? PhotoUrl { get; set; }
    public string Bio { get; set; } = string.Empty;
    public bool HasChangedGenericPassword { get; set; }
    public bool WasWarnedAboutPasswordChange { get; set; }
}