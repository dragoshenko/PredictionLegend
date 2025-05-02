namespace API.Entities;

public class Post
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public bool IsPublic { get; set; } = false;
    public bool IsPublished { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    // identifiers for advanced type of post
    public ICollection<Comment> Comments { get; set; } = [];
    public ICollection<Photo> Photos { get; set; } = [];
    // public ICollection<PostTag> PostTags { get; set; } = new List<PostTag>(); TO DO
    // public ICollection<PostCategory> PostCategories { get; set; } = new List<PostCategory>(); TO DO
    // Nav properties -------------------------------------------------
    public int? AppUserId { get; set; }
    public AppUser? AppUser { get; set; }
}