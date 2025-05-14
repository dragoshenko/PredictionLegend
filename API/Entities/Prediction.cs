using System;

namespace API.Entities;

public class Prediction
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string PredictionType { get; set; } = "ranking"; // Default to ranking
    public string PrivacyType { get; set; } = "public"; // Default to public
    public int Rows { get; set; } = 3; // Default values
    public int Columns { get; set; } = 1; // Default values
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastModified { get; set; }
    public bool IsPublished { get; set; } = false;
    
    // Navigation properties
    public int? AppUserId { get; set; }
    public AppUser? AppUser { get; set; }
    
    // Future enhancement: Add collection for prediction items and user entries
    // public ICollection<PredictionItem> Items { get; set; } = new List<PredictionItem>();
    // public ICollection<UserEntry> Entries { get; set; } = new List<UserEntry>();
}