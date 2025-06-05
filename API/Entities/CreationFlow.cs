using API.Entities;

namespace API.Entities;

public class CreationFlow
{
    public int Id { get; set; }
    public string FlowToken { get; set; } = string.Empty;
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public PredictionType PredictionType { get; set; }
    public int? TemplateId { get; set; }
    public int? PredictionId { get; set; }
    public Prediction? Prediction { get; set; }
    public string SelectedTeamIds { get; set; } = string.Empty; // JSON array
    public string CreatedTeamIds { get; set; } = string.Empty; // JSON array - teams created during this flow
    public bool IsCompleted { get; set; } = false;
    public bool IsAbandoned { get; set; } = false;
    public string? AbandonReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(2);
    public DateTime? CompletedAt { get; set; }
    public DateTime? AbandonedAt { get; set; }
}