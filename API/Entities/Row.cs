using System;

namespace API.Entities;

public class Row
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Column> Columns { get; set; } = [];
    public int Order { get; set; } = 0;
    public int PostRankId { get; set; }
    public PostRank PostRank { get; set; } = null!;
}
