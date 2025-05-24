using System;

namespace API.DTO;

public class UserPostBracketDTO
{
    public int UserId { get; set; }
    public PostBracketDTO PostBracket { get; set; } = null!;
}
