using System;

namespace API.DTO;

public class BingoTemplateDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int GridSize { get; set; } = 0;
    public bool OfficialTemplate { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
