namespace API.Entities;

public class DiscussionPost
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Content { get; set; }
    public bool IsPublic { get; set; } = false;
    public bool IsPublished { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public List<Photo> Photos { get; set; } = new List<Photo>();
    public List<Comment> Comments { get; set; } = new List<Comment>();
    public string PrivateKey { get; set; } = Guid.NewGuid().ToString();
    public string Slug { get; set; }
    // Nav properties -------------------------------------------------
    public int AppUserId { get; set; }
    public AppUser AppUser { get; set; } = null!;
    // ----------------------------------------------------------------
}