import { Row } from "./row";

export interface RankTable {
  id: number;
  numberOfRows: number;
  numberOfColumns: number;
  rows: Row[];
}
