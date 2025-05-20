export interface User {
  username: string;
  email: string;
  displayName: string;
  token: string;
  refreshToken: string;
  photoUrl: string;
  emailConfirmed: boolean;
  wasWarnedAboutPasswordChange: boolean;
  hasChangedGenericPassword: boolean;
  createdAt: Date;
  id?: number;
  roles?: string[];
}
