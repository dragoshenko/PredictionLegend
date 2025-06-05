// client/src/app/_models/bracketTemplate.ts - ENHANCED VERSION

import { BracketType } from "./bracketType";
import { Team } from "./team";

export interface BracketTemplate {
  id: number;
  name: string;
  officialTemplate: boolean;
  numberOfRounds: number;
  numberOfBrackets: number;  // Add this property
  createdAt?: Date;
  updatedAt?: Date;
  bracketType: BracketType;
  teams: Team[];
}

// Helper interface for bracket template creation
export interface CreateBracketTemplateDTO {
  name: string;
  numberOfRounds: number;
  bracketType: BracketType;
}

// Helper interface for bracket template update
export interface UpdateBracketTemplateDTO {
  id: number;
  name: string;
  numberOfRounds: number;
  bracketType: BracketType;
}
