using API.Entities;

namespace API.DTO;

public class CounterPredictionRequestDTO
{
    public int Id { get; set; }
    public string? Notes { get; set; }
    public PostRankDTO? PostRank { get; set; }
    public PostBracketDTO? PostBracket { get; set; }
    public PostBingoDTO? PostBingo { get; set; }
}