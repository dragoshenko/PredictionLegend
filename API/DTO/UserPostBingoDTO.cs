using System;

namespace API.DTO;

public class UserPostBingoDTO
{
    public int UserId { get; set; }
    public PostBingoDTO PostBingo { get; set; } = null!;
}
