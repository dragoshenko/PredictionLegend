using System;
using API.Entities;

namespace API.DTO;

public class BracketTemplateDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool OfficialTemplate { get; set; } 
    public int NumberOfRounds { get; set; }
    public int NumberOfBrackets { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public BracketType BracketType { get; set; } = BracketType.SingleTeam;
    public ICollection<TeamDTO> Teams { get; set; } = [];

}
