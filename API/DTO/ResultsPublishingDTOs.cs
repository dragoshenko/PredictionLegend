using API.Entities;

namespace API.DTO;

public class PublishResultsRequestDTO
{
    public int PredictionId { get; set; }
    public PredictionType PredictionType { get; set; }
    public string? Notes { get; set; }
    public PostRankDTO? ResultsPostRank { get; set; }
    public PostBracketDTO? ResultsPostBracket { get; set; }
    public PostBingoDTO? ResultsPostBingo { get; set; }
}

public class PredictionResultsDTO
{
    public int PredictionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public PredictionType PredictionType { get; set; }
    public DateTime ResultsPublishedAt { get; set; }
    public string? ResultsNotes { get; set; }
    public MemberDTO? Author { get; set; }
    
    // Official results
    public PostRankDTO? OfficialResults { get; set; }
    public PostBracketDTO? OfficialBracketResults { get; set; }
    public PostBingoDTO? OfficialBingoResults { get; set; }
    
    // Scored counter predictions
    public List<ScoredCounterPredictionDTO> ScoredCounterPredictions { get; set; } = [];
    
    // Summary statistics
    public PredictionResultsStatsDTO Stats { get; set; } = new();
}

public class ScoredCounterPredictionDTO
{
    public int Id { get; set; }
    public MemberDTO Author { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public float TotalScore { get; set; }
    public float CorrectCount { get; set; }
    public float IncorrectCount { get; set; }
    public float AccuracyPercentage { get; set; }
    public int Rank { get; set; } // Ranking among all counter predictions
    
    // Detailed scoring data
    public PostRankDTO? ScoredPostRank { get; set; }
    public PostBracketDTO? ScoredPostBracket { get; set; }
    public PostBingoDTO? ScoredPostBingo { get; set; }
}

public class PredictionResultsStatsDTO
{
    public int TotalCounterPredictions { get; set; }
    public int TotalParticipants { get; set; }
    public float AverageAccuracy { get; set; }
    public float HighestAccuracy { get; set; }
    public float LowestAccuracy { get; set; }
    public ScoredCounterPredictionDTO? BestPrediction { get; set; }
    public List<TeamAccuracyDTO> TeamAccuracyStats { get; set; } = [];
}

public class TeamAccuracyDTO
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public int CorrectPredictions { get; set; }
    public int TotalPredictions { get; set; }
    public float AccuracyPercentage { get; set; }
}