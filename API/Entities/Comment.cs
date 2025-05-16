namespace API.Entities;

public class Comment
{
    public int Id { get; set; }
    public required string Content { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int? ParentCommentId { get; set; }
    public Comment? ParentComment { get; set; }
    public ICollection<Comment> Replies { get; set; } = [];
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int? DiscussionPostId { get; set; }
    public DiscussionPost? DiscussionPost { get; set; }
    public int? PostRankId { get; set; }
    public PostRank? PostRank { get; set; }
    public int? PostBracketId { get; set; }
    public PostBracket? PostBracket { get; set; }

}
