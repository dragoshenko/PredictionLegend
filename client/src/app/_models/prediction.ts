import { Category } from "./category";
import { PostBracket } from "./postBracket";
import { PredictionType } from "./predictionType";
import { PrivacyType } from "./privacyType";
import { PostRank } from "./postRank";
import { PostBingo } from "./postBingo";

export interface Prediction {
  id: number;
  title? : string;
  description?: string;
  predictionType: PredictionType;
  privacyType: PrivacyType;
  isDraft: boolean;
  accessCode?: string;
  createdAt: Date;
  lastModified?: Date;
  categories?: Category[];
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  postBrackets?: PostBracket[];
  postRankings?: PostRank[];
  postBingos?: PostBingo[];
}
