using System;
using API.Entities;

namespace API.DTO;

public class PostDTO
{

    public int Id { get; set; }
    public string? Title { get; set; }
    public MemberDTO? Author { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Content { get; set; }
    public List<PhotoDTO>? Photos { get; set; }
    public List<CommentDTO>? Comments { get; set; }
    public int CommentsCount { get; set; }

}


public class PublishPostRequestDTO
{
    public int PredictionId { get; set; }
    public int TemplateId { get; set; }
    public PredictionType PredictionType { get; set; }
    public string? Notes { get; set; }
    public bool IsDraft { get; set; } = false;
    public PostRankDTO? PostRank { get; set; }
    public PostBracketDTO? PostBracket { get; set; }
    public PostBingoDTO? PostBingo { get; set; }
}

public class PublishedPostDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PredictionType PredictionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EndDate { get; set; }
    public MemberDTO Author { get; set; } = null!;
    public List<CategoryDTO> Categories { get; set; } = [];
    public int CounterPredictionsCount { get; set; }
    public bool CanCounterPredict { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
}

public class PostDetailDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public PredictionType PredictionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public MemberDTO Author { get; set; } = null!;
    public List<CategoryDTO> Categories { get; set; } = [];
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public bool CanCounterPredict { get; set; }
    public bool HasUserCounterPredicted { get; set; }
    
    // The original prediction data
    public PostRankDTO? OriginalPostRank { get; set; }
    public PostBracketDTO? OriginalPostBracket { get; set; }
    public PostBingoDTO? OriginalPostBingo { get; set; }
    
    // Counter predictions
    public List<CounterPredictionDTO> CounterPredictions { get; set; } = [];
    public int CounterPredictionsCount { get; set; }
}

public class CounterPredictionDTO
{
    public int Id { get; set; }
    public MemberDTO Author { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public string? Notes { get; set; }
    public float TotalScore { get; set; }
    public PostRankDTO? PostRank { get; set; }
    public PostBracketDTO? PostBracket { get; set; }
    public PostBingoDTO? PostBingo { get; set; }
}

public class UserPostSummaryDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public PredictionType PredictionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsDraft { get; set; }
    public bool IsActive { get; set; }
    public int CounterPredictionsCount { get; set; }
    public string? Notes { get; set; }
}
