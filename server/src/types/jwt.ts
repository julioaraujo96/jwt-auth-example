export interface JWTPayload {
  userId: string;
  email?: string;
}

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}
