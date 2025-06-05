import { Team } from "./team";


export interface BingoCell {
  id: number;
  score : number;
  createdAt: Date;
  updatedAt: Date;
  bingoId: number;
  row: number;
  column: number;
  team : Team;
  officialScore: number;
  isChecked: boolean;
}
