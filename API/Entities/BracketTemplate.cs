using System;

namespace API.Entities;

public class BracketTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool OfficialTemplate { get; set; } = false;
    public int NumberOfRounds { get; set; }
    public int NumberOfBrackets { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public BracketType BracketType { get; set; } = BracketType.SingleTeam;

    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public ICollection<PostBracket> PostBrackets { get; set; } = [];
    public ICollection<Team> Teams { get; set; } = [];

    public BracketTemplate(int numberOfRounds)
    {
        NumberOfRounds = numberOfRounds;
        NumberOfBrackets = (int)Math.Pow(2, numberOfRounds);
    }

    public void AddNewPostBracket()
    {
        PostBrackets.Add(new PostBracket(BracketType, NumberOfBrackets));
    }
}
