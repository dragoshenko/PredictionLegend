using System;

namespace API.DTO;

public class BracketDTO
{
    public int Id { get; set; }
    public float Score { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public TeamDTO? LeftTeam { get; set; }
    public int OfficialScoreLeftTeam { get; set; }
    public TeamDTO? RightTeam { get; set; }
    public int OfficialScoreRightTeam { get; set; }
    public int Order { get; set; }
    public bool IsWrong { get; set; } = false;
}
