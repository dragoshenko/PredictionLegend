using System;
using System.ComponentModel.DataAnnotations;

namespace API.Entities;

public class Team
{
    public int Id { get; set; }
    
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(500)]
    public string? PhotoUrl { get; set; }
    
    [StringLength(500)] // FIXED: Reduced from 1000 to 500 to match DTO validation
    public string Description { get; set; } = string.Empty; // FIXED: Changed to non-nullable to match database constraint
    
    public float? Score { get; set; }
    
    [Required]
    public int CreatedByUserId { get; set; }
    
    [Required]
    public AppUser CreatedByUser { get; set; } = null!;
    
    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}