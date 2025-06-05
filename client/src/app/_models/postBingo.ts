import { BingoCell } from "./bingoCell";
import { Team } from "./team";

export interface PostBingo {
  id : number;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  totalScore: number;
  isOfficialResult: boolean;
  bingoCells: BingoCell[];
  teams: Team[];
}
