namespace API.Entities;

public class Comment
{
    public int Id { get; set; }
    public required string Content { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // User Relationship
    public int? AppUserId { get; set; }
    public AppUser? AppUser { get; set; } 

    // Post Relationship
    public int PostId { get; set; }
    public Post Post { get; set; } = null!;

    // Comment Parent-Child relationship for nested comments
    public int? ParentCommentId { get; set; } = null;
    public Comment? ParentComment { get; set; } = null!;
    public ICollection<Comment> ChildComments { get; set; } = [];

    // Photos Relationship
    public ICollection<Photo> Photos { get; set; } = [];
}
