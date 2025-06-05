using System;

namespace API.Entities;

public class RankTable
{
    public int Id { get; set; }
    public int NumberOfRows { get; set; }
    public int NumberOfColumns { get; set; }
    public ICollection<Row> Rows { get; set; } = [];
    public int PostRankId { get; set; }
    public PostRank PostRank { get; set; } = null!;

    public RankTable()
    {
        Rows = new List<Row>();
    }

    public RankTable(int NumberOfRows, int NumberOfColumns)
    {
        this.NumberOfRows = NumberOfRows;
        this.NumberOfColumns = NumberOfColumns;
        Rows = new List<Row>(NumberOfRows);
        foreach (var row in Rows)
        {
            row.Columns = new List<Column>(NumberOfColumns);
        }
    }
}
