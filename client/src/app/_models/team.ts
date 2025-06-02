export interface Team {
  id: number;
  name: string;
  description?: string;
  score?: number;
  photoUrl?: string;
  createdByUserId: number;
  createdAt: Date;
}
