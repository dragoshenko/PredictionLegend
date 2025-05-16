using System;

namespace API.Entities;

public class PostBracket
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public ICollection<Comment> Comments { get; set; } = [];
    public RootBracket RootBracket { get; set; } = null!;
    public float TotalScore { get; set; }
    public bool IsOfficialResult { get; set; } = false;
}
