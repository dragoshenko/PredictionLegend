import { Column } from './column';

export interface Row {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  order: number;
  columns: Column[];
}
