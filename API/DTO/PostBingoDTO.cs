using System;
using API.Entities;

namespace API.DTO;

public class PostBingoDTO
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UserId { get; set; }
    public int GridSize { get; set; }
    public List<BingoCellDTO> BingoCells { get; set; } = [];
    public List<TeamDTO> Teams { get; set; } = [];
    public int TotalScore { get; set; }
    public bool IsOfficialResult { get; set; } = false;
    public MemberDTO? User { get; set; }
    public MemberDTO? Author { get; set; }
}
