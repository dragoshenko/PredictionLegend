public class CreateTeamRequestDTO
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PhotoUrl { get; set; }
    public float? Score { get; set; }
}