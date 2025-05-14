export interface Prediction {
  id: number;
  title: string;
  description?: string;
  predictionType: string;
  privacyType: string;
  rows: number;
  columns: number;
  createdAt: Date;
  lastModified?: Date;
  isPublished: boolean;
  author?: {
    id: number;
    displayName: string;
    photoUrl?: string;
  };
}

export interface CreatePredictionRequest {
  title: string;
  description?: string;
  predictionType: string;
  privacyType: string;
  rows: number;
  columns: number;
}
