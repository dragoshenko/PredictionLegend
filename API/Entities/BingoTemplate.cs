using System;

namespace API.Entities;

public class BingoTemplate
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int GridSize { get; set; } = 0;
    public bool OfficialTemplate { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public ICollection<Team> Teams { get; set; } = [];
    public ICollection<PostBingo> PostBingo { get; set; } = [];
}
