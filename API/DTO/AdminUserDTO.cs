namespace API.DTO;

public class AdminUserDTO
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string DisplayName { get; set; }
    public string Email { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastActive { get; set; }
    public List<string> Roles { get; set; }
    public bool HasPhoto { get; set; }
}