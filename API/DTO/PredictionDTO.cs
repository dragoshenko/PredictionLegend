using System;

namespace API.DTO;

public class PredictionDTO
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? PredictionType { get; set; }
    public string? PrivacyType { get; set; }
    public int Rows { get; set; }
    public int Columns { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastModified { get; set; }
    public bool IsPublished { get; set; }
    public MemberDTO? Author { get; set; }
}