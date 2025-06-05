using System;

namespace API.Entities;

public class RootBracket
{
    public int Id { get; set; }
    public float Score { get; set; }
    public BracketType BracketType { get; set; } = BracketType.SingleTeam;

    public Team? LeftTeam { get; set; }
    public int OfficialScoreLeftTeam { get; set; } = 0;
    public Team? RightTeam { get; set; }
    public int OfficialScoreRightTeam { get; set; } = 0;

    public ICollection<Bracket> Brackets { get; set; } = [];

    public RootBracket() { }
    public RootBracket(BracketType bracketType, int numberOfBrackets)
    {
        BracketType = bracketType;
        Brackets = new List<Bracket>(numberOfBrackets);
        for (int i = 0; i < numberOfBrackets; i++)
        {
            Brackets.Add(new Bracket(bracketType, i));
        }

        if(bracketType == BracketType.SingleTeam)
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
