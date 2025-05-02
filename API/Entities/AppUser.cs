using Microsoft.AspNetCore.Identity;

namespace API.Entities;

public class AppUser : IdentityUser<int>
{
    public required string DisplayName { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime LastActive { get; set; } = DateTime.Now;
    public Photo? Photo { get; set; }
    // Refresh token
    public List<RefreshToken> RefreshTokens { get; set; } = [];
    public List<Post> Posts { get; set; } = [];
    public List<Comment> Comments { get; set; } = [];
    public ICollection<AppUserRole> UserRoles { get; set; } = [];
}
