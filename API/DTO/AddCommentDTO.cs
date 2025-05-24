namespace API.DTO;

public class AddCommentDTO
{
    public string Content { get; set; } = string.Empty;
    public int? ParentCommentId { get; set; }
}