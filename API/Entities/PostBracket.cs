using System;

namespace API.Entities;

public class PostBracket
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int PredictionId { get; set; }
    public Prediction Prediction { get; set; } = null!;
    public RootBracket RootBracket { get; set; } = null!;
    public float TotalScore { get; set; }
    public bool IsOfficialResult { get; set; } = false;
    public ICollection<Team> Teams { get; set; } = [];

    public PostBracket() { }
    public PostBracket(BracketType bracketType, int numberOfBrackets)
    {
        RootBracket = new RootBracket(bracketType, numberOfBrackets);
        TotalScore = 0;
    }
}
