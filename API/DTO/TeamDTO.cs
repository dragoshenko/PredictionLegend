// API/DTO/TeamDTO.cs
using System;
using System.ComponentModel.DataAnnotations;

namespace API.DTO;

public class TeamDTO
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? Description { get; set; }
    
    [Url]
    public string? PhotoUrl { get; set; }
    
    public float? Score { get; set; }
    
    public int CreatedByUserId { get; set; }
    
    public DateTime CreatedAt { get; set; }
}