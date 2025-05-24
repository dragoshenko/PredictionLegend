using System;
using API.Entities;

namespace API.DTO;

public class BingoCellDTO
{
    public int Id { get; set; }
    public float Score { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int BingoId { get; set; }
    public int Row { get; set; }
    public int Column { get; set; }
    public Team? Team { get; set; }
    public int OfficialScore { get; set; } = 0;
    public bool IsWrong { get; set; } = false;
}
