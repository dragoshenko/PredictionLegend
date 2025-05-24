import { Team } from "./team";

export interface RankingTemplate{
  id: number;
  name: string;
  officialTemplate: boolean;
  numberOfRows: number;
  numberOfColumns: number;
  teams: Team[];
}
