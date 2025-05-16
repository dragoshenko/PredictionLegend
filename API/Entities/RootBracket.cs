using System;

namespace API.Entities;

public class RootBracket
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public float Score { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int LeftBracketId { get; set; }
    public Bracket LeftBracket { get; set; } = null!;
    public int RightBracketId { get; set; }
    public Bracket RightBracket { get; set; } = null!;
    public int PostBracketId { get; set; }
    public PostBracket PostBracket { get; set; } = null!;
    public ICollection<Bracket> Brackets { get; set; } = [];
}
