using System;

namespace API.Entities;

public class Row
{
    public int Id { get; set; }
    public ICollection<Column> Columns { get; set; } = [];
    public int Order { get; set; } = 0;
    public bool IsWrong { get; set; } = false;

    public Row()
    {
        Columns = [];
    }

    public Row(List<Column> columns)
    {
        Columns = columns;
    }
}
