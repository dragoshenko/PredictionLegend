using System;

namespace API.Entities;

public class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string? Description { get; set; }
    public float? Score { get; set; }
    public int CreatedByUserId { get; set; }
    public AppUser CreatedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

