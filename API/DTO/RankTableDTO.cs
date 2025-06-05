using System;
using API.Entities;

namespace API.DTO;

public class RankTableDTO
{
    public int Id { get; set; }
    public int NumberOfRows { get; set; }
    public int NumberOfColumns { get; set; }
    public List<RowDTO> Rows { get; set; } = [];
}
