using Microsoft.AspNetCore.Identity;

namespace API.Entities;

public class AppUser : IdentityUser<int>
{
    public required string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime LastActive { get; set; } = DateTime.Now;
    public Photo? Photo { get; set; }
    public string? EmailVerificationCode { get; set; } = string.Empty;
    public DateTime? EmailVerificationCodeExpiry { get; set; }
    public string? PasswordResetCode { get; set; } = string.Empty;
    public DateTime? PasswordResetCodeExpiry { get; set; }
    public List<RefreshToken> RefreshTokens { get; set; } = [];
    public int CommentsCount { get; set; } = 0;
    public ICollection<AppUserRole> UserRoles { get; set; } = [];
    public string? PasswordChangeCode { get; set; }
    public DateTime? PasswordChangeCodeExpiry { get; set; }
    public bool HasChangedGenericPassword { get; set; } = true;
    public bool WasWarnedAboutPasswordChange { get; set; } = true;
    public List<Prediction> Predictions { get; set; } = [];
    public List<BracketTemplate> BracketTemplates { get; set; } = [];
    public List<PostBracket> PostBrackets { get; set; } = [];
    public List<RankingTemplate> RankingTemplates { get; set; } = [];
    public List<PostRank> PostRanks { get; set; } = [];
    public List<BingoTemplate> BingoTemplates { get; set; } = [];
    public List<PostBingo> PostBingos { get; set; } = [];
    public List<DiscussionPost> DiscussionPosts { get; set; } = [];
    public List<Team> Teams { get; set; } = [];
}
