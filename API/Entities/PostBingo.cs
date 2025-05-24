using System;

namespace API.Entities;

public class PostBingo
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public int GridSize { get; set; } = 0;
    public AppUser User { get; set; } = null!;
    public ICollection<BingoCell> BingoCells { get; set; } = [];
    public ICollection<Team> Teams { get; set; } = [];
    public int TotalScore { get; set; }
    public bool IsOfficialResult { get; set; } = false;

    public PostBingo() { }
    public PostBingo(int gridSize)
    {
        GridSize = gridSize;
        TotalScore = 0;
        BingoCells = new List<BingoCell>(gridSize * gridSize);
        for (int i = 0; i < gridSize; i++)
        {
            for (int j = 0; j < gridSize; j++)
            {
                BingoCells.Add(new BingoCell { Row = i, Column = j });
            }
        }
    }
}
