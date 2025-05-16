using System;

namespace API.Entities;

public class PostRank
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public ICollection<Comment> Comments { get; set; } = [];
    public ICollection<Row> Rows { get; set; } = [];
    public float TotalScore { get; set; }
    public bool IsOfficialResult { get; set; } = false;
}
