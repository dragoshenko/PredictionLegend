interface RankingItem {
  id: string;
  name: string;
  description?: string;
  predictedScore?: number;
  isTemporary?: boolean;
}
