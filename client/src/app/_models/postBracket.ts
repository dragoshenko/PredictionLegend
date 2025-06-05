import { RootBracket } from "./rootBracket";
import { Team } from "./team";

export interface PostBracket {
  id : number;
  createdAt : Date;
  updatedAt : Date;
  rootBracket: RootBracket;
  totalScore: number;
  isOfficialResult: boolean;
  teams: Team[];
}
