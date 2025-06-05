using System;

namespace API.Entities;

public class Column
{
    public int Id { get; set; }
    public Team? Team { get; set; }
    public int OfficialScore { get; set; } = 0;
    public int Order { get; set; } = 0;
}
