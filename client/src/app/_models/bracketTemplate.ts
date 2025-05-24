import { BracketType } from "./bracketType";
import { Team } from "./team";

export interface BracketTemplate {
  id : number;
  name : string;
  officialTemplate: boolean;
  numberOfRounds: number;
  bracketType: BracketType;
  teams : Team[];
}
