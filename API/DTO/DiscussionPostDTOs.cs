using API.Entities;

namespace API.DTO;

public class DiscussionPostDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PrivacyType PrivacyType { get; set; } = PrivacyType.Public;
    public DateTime CreatedAt { get; set; }
    public DateTime LastModified { get; set; }
    public bool IsDraft { get; set; } = true;
    public string? AccessCode { get; set; }
    public List<string> Tags { get; set; } = [];
    public List<CommentDTO> Comments { get; set; } = [];
    public MemberDTO? Author { get; set; }
    public int CommentsCount { get; set; }
    public int UpVotes { get; set; }
    public int DownVotes { get; set; }
}

public class CreateDiscussionPostDTO
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PrivacyType PrivacyType { get; set; } = PrivacyType.Public;
    public List<string> Tags { get; set; } = [];
}

public class UpdateDiscussionPostDTO
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public PrivacyType PrivacyType { get; set; } = PrivacyType.Public;
    public List<string> Tags { get; set; } = [];
}