using System;

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
