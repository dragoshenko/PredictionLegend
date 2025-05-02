using System;

namespace API.Entities;

public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime Created {get; set; } = DateTime.UtcNow;
    public DateTime Expires { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? Revoked { get; set; }

    public AppUser? AppUser { get; set; }
    public int? AppUserId { get; set; }
}
