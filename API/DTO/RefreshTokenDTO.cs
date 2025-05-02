using System;

namespace API.DTO;

public class RefreshTokenDTO
{
    public required string Token { get; set; }
    public required string RefreshToken { get; set; }
}
