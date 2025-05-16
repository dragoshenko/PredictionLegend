using System.ComponentModel.DataAnnotations.Schema;

namespace API.Entities;

[Table("Photos")]
public class Photo
{
    public int Id { get; set; }
    public required string Url { get; set; }
    public string? PublicId { get; set; }
    // Nav properties -------------------------------------------------
    // Polymorphic relationship with AppUser, Post, Comment
    // AppUser
    public AppUser? AppUser { get; set; } = null!;
    public int? AppUserId { get; set; }

    // ----------------------------------------------------------------
}