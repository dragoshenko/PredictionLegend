using System;
using API.Entities;

namespace API.DTO;

public class MemberDTO
{
    public int Id { get; set; }
    public string? DisplayName { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Bio { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastActive { get; set; }
    public PhotoDTO? Photo { get; set; }
    public int CommentsCount { get; set; }
    public int PostsCount { get; set; }
}
