using System;

namespace API.Entities;

public class PostRank
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int PredictionId { get; set; }
    public Prediction Prediction { get; set; } = null!;
    public RankTable RankTable { get; set; } = null!;
    public bool IsOfficialResult { get; set; } = false;
    public float TotalScore { get; set; }
    public ICollection<Team> Teams { get; set; } = [];

    public PostRank() { }
    public PostRank(int numberOfRows, int numberOfColumns)
    {
        RankTable = new RankTable(numberOfRows, numberOfColumns);
        TotalScore = 0;
    }

}
