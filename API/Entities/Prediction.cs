using System;

namespace API.Entities;

public class Prediction
{
    public int Id { get; set; }
    public required string Title { get; set; } = string.Empty;
    public required string Description { get; set; } = string.Empty;
    public PredictionType PredictionType { get; set; } = PredictionType.Ranking;
    public PrivacyType PrivacyType { get; set; } = PrivacyType.Public;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastModified { get; set; } = DateTime.UtcNow;
    public bool IsDraft { get; set; } = true;
    public string? AccessCode { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<PostBracket> PostBrackets { get; set; } = [];
    public ICollection<PostBingo> PostBingos { get; set; } = [];
    public ICollection<PostRank> PostRanks { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];

    public List<PredictionCategory> Categories { get; set; } = [];

    public int? UserId { get; set; }
    public AppUser? User { get; set; }

    public Prediction()
    {

    }

    public void IsActivePrediction()
    {
        if (StartDate != null && EndDate != null)
        {
            IsActive = DateTime.UtcNow >= StartDate && DateTime.UtcNow <= EndDate;
        }
        else
        {
            IsActive = true;
        }
    }
}