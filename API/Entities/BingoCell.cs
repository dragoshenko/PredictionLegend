using System;

namespace API.Entities;

public class BingoCell
{
    public int Id { get; set; }
    public float Score { get; set; }

    public int Row { get; set; }
    public int Column { get; set; }

    public Team Team { get; set; } = null!;
    public int OfficialScore { get; set; } = 0;

    public bool IsWrong { get; set; } = false;
}
