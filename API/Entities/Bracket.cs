using API.Entities;

public class Bracket
{
    public int Id { get; set; }
    public float Score { get; set; }

    public int? RootBracketId { get; set; }
    public RootBracket? RootBracket { get; set; }

    public Team? LeftTeam { get; set; }
    public int OfficialScoreLeftTeam { get; set; } = 0;
    public Team? RightTeam { get; set; }
    public int OfficialScoreRightTeam { get; set; } = 0;

    public bool IsWrong { get; set; } = false;


    public int Order { get; set; } = 0;

    public Bracket() { }
    public Bracket(BracketType bracketType, int order)
    {
        Order = order;
        if (bracketType == BracketType.SingleTeam)
        {
            LeftTeam = new Team();
        }
        else
        {
            LeftTeam = new Team();
            RightTeam = new Team();
        }
    }
}
