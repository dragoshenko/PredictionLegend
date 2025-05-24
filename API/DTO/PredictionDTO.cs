using System;
using System.ComponentModel.DataAnnotations;
using API.Entities;

namespace API.DTO;

public class PredictionDTO
{
    public int Id { get; set; }
    [Required]
    public required string Title { get; set; }
    [Required]
    public required string Description { get; set; }
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public PredictionType PredictionType { get; set; }
    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public PrivacyType PrivacyType { get; set; }
    public bool IsDraft { get; set; }
    public string? AccessCode { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime LastModified { get; set; }
    public ICollection<int> Categories { get; set; } = [];
    public ICollection<PostBracketDTO> PostBrackets { get; set; } = [];
    public ICollection<PostBingoDTO> PostBingos { get; set; } = [];
    public ICollection<PostRankDTO> PostRanks { get; set; } = [];
}