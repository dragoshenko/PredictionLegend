import { Bracket } from "./bracket";
import { BracketType } from "./bracketType";
import { Team } from "./team";

export interface RootBracket {
  id : number;
  createdAt : Date;
  updatedAt : Date;
  score: number;
  bracketType: BracketType;
  leftTeam: Team;
  officialScoreLeftTeam: number;
  rightTeam: Team;
  officialScoreRightTeam: number;
  brackets: Bracket[];
}
