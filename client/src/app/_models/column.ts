import { Team } from './team';

export interface Column {
  id: number;
  team?: Team;
  officialScore: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
