import { Team } from "./team";

export interface BingoTemplate {
  id: number;
  name: string;
  officialTemplate: boolean;
  gridSize: number;
  teams: Team[];
}
