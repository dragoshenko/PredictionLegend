using System;

namespace API.DTO;

public class ColumnDTO
{
    public int Id { get; set; }
    public TeamDTO? Team { get; set; }
    public int OfficialScore { get; set; } = 0;
    public int Order { get; set; }
}
