import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload } from '../types/jwt';

const JWT_EXPIRATION_TIME = process.env.JWT_LIFETIME || '1h';

/**
 * Generates a JWT token for the given user ID.
 *
 * The token is signed with the JWT_SECRET environment variable and
 * expires after the time specified in the JWT_LIFETIME environment variable.
 *
 * @throws {Error} If the JWT_SECRET environment variable is not defined
 */
export const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const options: SignOptions = {
    expiresIn: JWT_EXPIRATION_TIME as any, // Typescript wasn't happy with env variables
  };

  return jwt.sign({ userId }, jwtSecret, options);
};

/**
 * Verifies a JWT token.
 *
 * @throws {Error} If the JWT_SECRET environment variable is not defined
 */
export const verifyToken = (token: string): JWTPayload => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  return jwt.verify(token, jwtSecret) as JWTPayload;
};
