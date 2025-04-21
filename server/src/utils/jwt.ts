import jwt, { SignOptions } from 'jsonwebtoken';
import { JWTPayload, TokenType } from '../types/jwt';
import { prisma } from '../utils/db';
import crypto from 'crypto';

const JWT_EXPIRATION_TIME = process.env.JWT_LIFETIME || '5m';
const JWT_REFRESH_EXPIRATION_TIME = process.env.JWT_REFRESHLIFETIME || '1d';

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
export const verifyToken = (token: string, type: TokenType): JWTPayload => {
  const secret =
    type === TokenType.REFRESH
      ? process.env.JWT_REFRESH_SECRET
      : process.env.JWT_SECRET;

  if (!secret) throw new Error(`Secret for ${type} tokens is not defined`);

  return jwt.verify(token, secret) as JWTPayload;
};

/**
 * Generates a refresh token for the given user ID.
 *
 * The token is signed with the JWT_REFRESH_SECRET environment variable and
 * expires after the time specified in the REFRESH_TOKEN_EXPIRATION environment
 * variable. The token is also stored in the database for revocation.
 *
 * The token is a JWT token with a unique ID claim (standard JWT claim `jti`) that
 * is used to identify the token in the database.
 *
 * @throws {Error} If the JWT_REFRESH_SECRET environment variable is not defined
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  const jti = crypto.randomUUID();

  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRATION_TIME as any,
    jwtid: jti,
  };

  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId,
    },
  });

  return jwt.sign({ userId }, secret, options);
};

/**
 * Verifies a refresh token.
 *
 * Checks if the token is valid and not revoked.
 * If the token is valid, it returns the user ID associated with the token.
 * If the token is invalid or revoked, it returns null.
 *
 * @param token The refresh token to verify
 * @returns The user ID associated with the token, or null if the token is invalid or revoked
 */
export const verifyRefreshToken = async (
  token: string
): Promise<string | null> => {
  try {
    const payload = verifyToken(token, TokenType.REFRESH) as JWTPayload & {
      jti?: string;
    };

    if (!payload.jti) return null;

    // Check if token has been revoked (doesn't exist in database)
    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });

    if (!storedToken) return null;

    return payload.userId;
  } catch (error) {
    return null;
  }
};

/**
 * Invalidates a refresh token.
 *
 * Deletes the token from the database, effectively revoking it.
 * If the token is invalid or doesn't exist in the database, it returns false.
 * If the token is successfully invalidated, it returns true.
 *
 * @param token The refresh token to invalidate
 * @returns True if the token was successfully invalidated, false otherwise
 */
export const invalidateRefreshToken = async (
  token: string
): Promise<boolean> => {
  try {
    const payload = jwt.decode(token) as JWTPayload & { jti?: string };

    if (!payload?.jti) return false;

    // Delete the token from the database to invalidate it
    await prisma.refreshToken.delete({
      where: { id: payload.jti },
    });

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Invalidates all refresh tokens associated with a given user.
 *
 * Deletes all refresh tokens from the database that are associated with the given user ID.
 * If the operation is successful, it returns true. If there is an error, it returns false.
 *
 * @param userId The user ID to invalidate all refresh tokens for
 * @returns True if all refresh tokens were successfully invalidated, false otherwise
 */
export const invalidateAllUserRefreshTokens = async (
  userId: string
): Promise<boolean> => {
  try {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
    return true;
  } catch (error) {
    return false;
  }
};
