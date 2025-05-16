using System;

namespace API.Entities;

public class Prediction
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public PredictionType Type { get; set; } = PredictionType.Ranking; // Default to Ranking
    public PrivacyType PrivacyType { get; set; } = PrivacyType.Public; // Default to Public
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastModified { get; set; } = DateTime.UtcNow;
    public bool IsDraft { get; set; } = true;
    public string? AccessCode { get; set; }
    public ICollection<string> Tags { get; set; } = new List<string>();
    public ICollection<PostBracket> PostBrackets { get; set; } = [];
    public ICollection<PostRank> PostRankings { get; set; } = [];
    
    public int? UserId { get; set; }
    public AppUser? User { get; set; }
}