using System;
using API.Entities;

namespace API.DTO;

public class PostBracketDTO
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UserId { get; set; }
    public RootBracketDTO RootBracket { get; set; } = null!;
    public float TotalScore { get; set; }
    public bool IsOfficialResult { get; set; } = false;
    public List<Team> Teams { get; set; } = [];

}
