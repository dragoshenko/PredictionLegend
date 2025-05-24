using System;

namespace API.DTO;

public class RowDTO
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int Order { get; set; }
    public List<ColumnDTO> Columns { get; set; } = [];
    public bool IsWrong { get; set; } = false;
}
