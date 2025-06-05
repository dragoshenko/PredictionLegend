using System;
using API.DTOs;

namespace API.DTO;

public class UserRankingTemplateDTO
{
    public int UserId { get; set; }
    public RankingTemplateDTO RankingTemplate { get; set; } = null!;
}
