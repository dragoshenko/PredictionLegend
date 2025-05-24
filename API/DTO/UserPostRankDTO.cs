using System;

namespace API.DTO;

public class UserPostRankDTO
{
    public int UserId { get; set; }
    public PostRankDTO PostRank { get; set; } = null!;
}
