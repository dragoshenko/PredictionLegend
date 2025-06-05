export interface PredictionStep1Data {
  predictionType: 'ranking' | 'bracket' | 'bingo';
  title: string;
  description?: string;
  privacyType: 'public' | 'private' | 'linkOnly';
  coverPhoto?: File;
  categoryIds: number[];
  isPublished: boolean;
}
