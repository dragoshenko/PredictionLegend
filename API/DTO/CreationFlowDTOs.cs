using API.Entities;

namespace API.DTO;

public class CreatePredictionFlowDTO
{
    public int Id { get; set; }
    public string FlowToken { get; set; } = string.Empty;
    public int UserId { get; set; }
    public PredictionType PredictionType { get; set; }
    public int? TemplateId { get; set; }
    public List<int> SelectedTeamIds { get; set; } = [];
    public PredictionDTO? Prediction { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(2);
}

public class EditTemplateRequestDTO
{
    public int TemplateId { get; set; }
    public PredictionType PredictionType { get; set; }
    public string FlowToken { get; set; } = string.Empty;
}

public class EditTemplateResponseDTO
{
    public int TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public PredictionType PredictionType { get; set; }
    public bool IsOfficialTemplate { get; set; }
    public List<TeamDTO> ExistingTeams { get; set; } = [];
    public List<TeamDTO> UserTeams { get; set; } = [];
    public int MinimumTeamsRequired { get; set; }
    public string FlowToken { get; set; } = string.Empty;
}

public class SelectTeamsDTO
{
    public string FlowToken { get; set; } = string.Empty;
    public List<int> SelectedTeamIds { get; set; } = [];
    public List<TeamDTO> NewTeams { get; set; } = []; // Teams created during this flow
}

public class CreatePostRequestDTO
{
    public string FlowToken { get; set; } = string.Empty;
    public int PredictionId { get; set; }
    public PostRankDTO? PostRank { get; set; }
    public PostBracketDTO? PostBracket { get; set; }
    public PostBingoDTO? PostBingo { get; set; }
}

public class CreateCounterPredictionDTO
{
    public int OriginalPredictionId { get; set; }
    public int TemplateId { get; set; }
    public PredictionType PredictionType { get; set; }
    public PostRankDTO? PostRank { get; set; }
    public PostBracketDTO? PostBracket { get; set; }
    public PostBingoDTO? PostBingo { get; set; }
}

public class AbandonFlowDTO
{
    public string FlowToken { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}