using System;

namespace API.DTO;

public class PostRankDTO
{
    public int Id { get; set; }
    public int RankingTemplateId { get; set; }
    public int PredictionId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UserId { get; set; }
    public RankTableDTO RankTable { get; set; } = null!;
    public bool IsOfficialResult { get; set; } = false;
    public float TotalScore { get; set; }
    public List<TeamDTO> RankTeams { get; set; } = [];
    public MemberDTO? User { get; set; }
    public MemberDTO? Author { get; set; }
}
