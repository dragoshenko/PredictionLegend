export interface User {
  username: string;
  email: string;
  displayName: string;
  token: string;
  refreshToken: string;
  photoUrl: string;
  emailConfirmed: boolean;
  createdAt: Date;
  id?: number;
}
