namespace API.DTO;

public class BracketPredictionDTO
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? PredictionType { get; set; }
    public string? PrivacyType { get; set; }
    public int Rounds { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastModified { get; set; }
    public bool IsPublished { get; set; }
    public MemberDTO? Author { get; set; }
    public List<CategoryDTO>? Categories { get; set; } = new List<CategoryDTO>();
}

public class BracketPredictionDetailDTO : BracketPredictionDTO
{
    public List<BracketMatchDTO> Matches { get; set; } = new List<BracketMatchDTO>();
    public BracketMatchDTO? FinalChampion { get; set; }
}

public class BracketMatchDTO
{
    public int Id { get; set; }
    public int Round { get; set; }
    public string? Team1 { get; set; }
    public string? Team2 { get; set; }
    public string? Winner { get; set; }
    public string? Content { get; set; }
}

public class CreateBracketDTO
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string PrivacyType { get; set; } = "public";
    public int Rounds { get; set; } = 3;
    public bool IsPublished { get; set; } = false;
    public List<int> CategoryIds { get; set; } = new List<int>();
    public List<BracketMatchDTO> Matches { get; set; } = new List<BracketMatchDTO>();
}