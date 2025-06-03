// API/DTO/BracketTemplateDTO.cs - ENHANCED VERSION

using System;
using System.Text.Json.Serialization;
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
    // json enum deserialization
    [JsonConverter(typeof(JsonStringEnumConverter))]
    [JsonPropertyName("bracketType")]
    public BracketType BracketType { get; set; } = BracketType.SingleTeam;
    public ICollection<TeamDTO> Teams { get; set; } = [];
    public int UserId { get; set; }
}

// Additional DTOs for bracket template operations
public class CreateBracketTemplateDTO
{
    public required string Name { get; set; }
    public int NumberOfRounds { get; set; }
    public BracketType BracketType { get; set; } = BracketType.SingleTeam;
}

public class UpdateBracketTemplateDTO
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public int? NumberOfRounds { get; set; }
    public BracketType? BracketType { get; set; }
}