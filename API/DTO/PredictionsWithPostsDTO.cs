using API.DTO;
using API.Entities;

public class PredictionWithPostsDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PredictionType PredictionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
    public bool IsDraft { get; set; }
    public int UserId { get; set; }
    public MemberDTO? Author { get; set; }
    public List<CategoryDTO> Categories { get; set; } = new();
    
    // Add counter predictions count for "my predictions" view
    public int CounterPredictionsCount { get; set; }
    
    // Add privacy information
    public PrivacyType PrivacyType { get; set; }
    public string? AccessCode { get; set; }
    
    // Post data based on prediction type
    public List<PostRankDTO>? PostRanks { get; set; }
    public List<PostBracketDTO>? PostBrackets { get; set; }
    public List<PostBingoDTO>? PostBingos { get; set; }
}