using API.Entities;

public class Bracket
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public float Score { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Root bracket reference
    public int? RootBracketId { get; set; }
    public RootBracket? RootBracket { get; set; }

    // Parent bracket
    public int? ParentBracketId { get; set; }
    public Bracket? ParentBracket { get; set; }

    // Self-referencing left/right brackets
    public int? LeftBracketId { get; set; }
    public Bracket? LeftBracket { get; set; }

    public int? RightBracketId { get; set; }
    public Bracket? RightBracket { get; set; }

    public int Order { get; set; } = 0;

    public ICollection<Bracket> Children { get; set; } = [];
}
