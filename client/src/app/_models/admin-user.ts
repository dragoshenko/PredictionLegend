export interface AdminUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: Date;
  lastActive: Date;
  roles: string[];
  hasPhoto: boolean;
}

export interface AdminUserDetail {
  id: number;
  username: string;
  displayName: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: Date;
  lastActive: Date;
  roles: string[];
  photoUrl: string;
  bio: string;
  hasChangedGenericPassword: boolean;
  wasWarnedAboutPasswordChange: boolean;
}
