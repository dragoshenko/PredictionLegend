export interface SystemInfo {
  appVersion: string;
  environment: string;
  serverTime: Date;
  totalActiveUsers: number;
  totalPredictions: number;
  lastDatabaseBackup?: Date;
  serverUptime: string;
}
