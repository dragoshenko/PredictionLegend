export interface Team {
  id: number;
  name: string;
  description?: string;
  photoUrl?: string;
  score?: number;
  createdByUserId: number;
  createdAt: Date;
}
