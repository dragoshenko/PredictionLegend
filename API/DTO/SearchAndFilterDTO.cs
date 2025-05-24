using API.Entities;

namespace API.DTO;

public class PredictionSearchDTO
{
    public string? SearchTerm { get; set; }
    public List<int>? CategoryIds { get; set; }
    public PredictionType? PredictionType { get; set; }
    public PrivacyType? PrivacyType { get; set; }
    public string? SortBy { get; set; } = "CreatedAt"; // CreatedAt, LastModified, Title
    public bool SortDescending { get; set; } = true;
    public bool? IsActive { get; set; }
    public bool? IsDraft { get; set; }
    public DateTime? CreatedAfter { get; set; }
    public DateTime? CreatedBefore { get; set; }
    public int? UserId { get; set; }
}

public class PaginatedResponse<T>
{
    public List<T> Items { get; set; } = [];
    public int TotalItems { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrevious { get; set; }
}