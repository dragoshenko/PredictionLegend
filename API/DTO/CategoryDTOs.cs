namespace API.DTO;

public class CategoryDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? IconName { get; set; }
    public string? ColorCode { get; set; }
    public int? ParentCategoryId { get; set; }
    public List<CategoryDTO>? SubCategories { get; set; }
}

public class CreateCategoryDTO
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? IconName { get; set; }
    public string? ColorCode { get; set; }
    public int? ParentCategoryId { get; set; }
}

public class UpdateCategoryDTO
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? IconName { get; set; }
    public string? ColorCode { get; set; }
    public int? ParentCategoryId { get; set; }
}