using System;
using API.Entities;

namespace API.DTO;

public class RootBracketDTO
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UserId { get; set; }
    public float Score { get; set; }
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public BracketType BracketType { get; set; } = BracketType.SingleTeam;
    public Team? LeftTeam { get; set; }
    public int OfficialScoreLeftTeam { get; set; } = 0;
    public Team? RightTeam { get; set; }
    public int OfficialScoreRightTeam { get; set; } = 0;

    public ICollection<BracketDTO> Brackets { get; set; } = [];

}
