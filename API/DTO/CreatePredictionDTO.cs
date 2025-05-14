namespace API.DTO;

public class CreatePredictionDTO
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string PredictionType { get; set; } = "ranking";
    public required string PrivacyType { get; set; } = "public";
    public int Rows { get; set; } = 3;
    public int Columns { get; set; } = 1;
}