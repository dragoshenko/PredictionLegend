import { RankTable } from "./rankTable";
import { Team } from "./team";

export interface PostRank {
  id : number;
  rankingTemplateId : number;
  predictionId : number;
  createdAt : Date;
  updatedAt : Date;
  userId : number;
  rankTable: RankTable;
  teams: Team[];
  isOfficialResult: boolean;
  totalScore: number;
}
