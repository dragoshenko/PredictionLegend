export interface EmailVerificationDTO {
  id: number;
  code: string;
}

export interface ResendVerificationCodeDTO {
  userId: number;
}
