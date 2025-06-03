// Add to API/DTO/CounterPredictionDTOs.cs

using API.Entities;

namespace API.DTO;

public class UserCounterPredictionSummaryDTO
{
    public int Id { get; set; }
    public int OriginalPredictionId { get; set; }
    public string OriginalTitle { get; set; } = string.Empty;
    public MemberDTO? OriginalAuthor { get; set; }
    public PredictionType PredictionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public float TotalScore { get; set; }
    public bool IsCounterPrediction { get; set; } = true;
    public string CounterPredictionType { get; set; } = string.Empty; // "Ranking", "Bingo", "Bracket"
}

public class UserCounterPredictionDetailDTO
{
    public int Id { get; set; }
    public int OriginalPredictionId { get; set; }
    public string? OriginalTitle { get; set; }
    public MemberDTO? OriginalAuthor { get; set; }
    public PredictionType PredictionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public float TotalScore { get; set; }
    public bool IsCounterPrediction { get; set; } = true;
    public string CounterPredictionType { get; set; } = string.Empty;
    
    // The actual counter prediction data
    public PostRankDTO? PostRank { get; set; }
    public PostBracketDTO? PostBracket { get; set; }
    public PostBingoDTO? PostBingo { get; set; }
}