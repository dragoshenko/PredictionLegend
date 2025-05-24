import { Team } from "./team";

export interface Bracket {
  id : number;
  score: number;
  createdAt : Date;
  updatedAt : Date;
  leftTeam: Team;
  officialScoreLeftTeam: number;
  rightTeam: Team;
  officialScoreRightTeam: number;
  order: number;
}
