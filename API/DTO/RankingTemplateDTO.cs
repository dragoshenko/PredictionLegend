using System;

namespace API.DTO;

public class RankingTemplateDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int UserId { get; set; }
    public bool OfficialTemplate { get; set; } = false;
    public int NumberOfRows { get; set; } = 0;
    public int NumberOfColumns { get; set; } = 0;

    public RankingTemplateDTO()
    {
        NumberOfRows = 0;
        NumberOfColumns = 0;
    }

    public RankingTemplateDTO(int NumberOfRows, int NumberOfColumns)
    {
        this.NumberOfRows = NumberOfRows;
        this.NumberOfColumns = NumberOfColumns;
    }
}
