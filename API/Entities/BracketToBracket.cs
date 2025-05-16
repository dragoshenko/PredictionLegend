public class BracketToBracket
{
    public int LeftBracketId { get; set; }
    public Bracket LeftBracket { get; set; } = null!;

    public int RightBracketId { get; set; }
    public Bracket RightBracket { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
