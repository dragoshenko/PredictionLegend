using System;

namespace API.Entities;

public class RankingTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool OfficialTemplate { get; set; } = false;
    public int NumberOfRows { get; set; } = 0;
    public int NumberOfColumns { get; set; } = 0;

    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public ICollection<PostRank> PostRanks { get; set; } = [];
    public ICollection<Team> Teams { get; set; } = [];
    public RankingTemplate()
    {
        NumberOfRows = 0;
        NumberOfColumns = 0;
    }

    public RankingTemplate(int NumberOfRows, int NumberOfColumns)
    {
        this.NumberOfRows = NumberOfRows;
        this.NumberOfColumns = NumberOfColumns;
    }

    public void AddNewPostRank(int numberOfRows, int numberOfColumns)
    {
        PostRanks.Add(new PostRank(numberOfRows, numberOfColumns));
    }
}
