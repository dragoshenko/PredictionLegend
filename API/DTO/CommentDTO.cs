using System;

namespace API.DTO;

public class CommentDTO
{
    public int Id { get; set; }
    public string? Content { get; set; }
    public MemberDTO? Author { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<CommentDTO>? ChildComments { get; set; }
    public int CommentsCount { get; set; }
}
