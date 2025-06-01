namespace API.Entities;

public class DiscussionPost
{
   public int Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public PrivacyType PrivacyType { get; set; } = PrivacyType.Public; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastModified { get; set; } = DateTime.UtcNow;
    public bool IsDraft { get; set; } = true;
    public string? AccessCode { get; set; }
    public ICollection<string> Tags { get; set; } = new List<string>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    
    public int? UserId { get; set; }
    public AppUser? User { get; set; }

}