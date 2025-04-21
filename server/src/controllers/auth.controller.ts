import { userRepository } from './../repositories/user.repo';
import {
  generateRefreshToken,
  generateToken,
  invalidateAllUserRefreshTokens,
  invalidateRefreshToken,
  verifyRefreshToken,
  verifyToken,
} from '../utils/jwt';
import { CookieOptions, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { TokenType } from '../types/jwt';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');
const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

// Cookie options for refresh token
const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true, // Prevents JavaScript access
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict', // Prevents CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth', // Only accessible by auth routes
};

/**
 * Registers a new user.
 *
 * @param {Request} req The request object
 * @param {Response} res The response object
 *
 * @returns {Promise<void>} A promise that resolves to nothing
 *
 * @throws {Error} If the user already exists
 * @throws {Error} If there is an internal server error
 */
export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await userRepository.create({
      email,
      password: passwordHash,
    });

    const accessToken = generateToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      refreshTokenCookieOptions
    );

    res.status(201).json({ token: accessToken });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Logs in a user.
 *
 * @param {Request} req The request object
 * @param {Response} res The response object
 *
 * @returns {Promise<void>} A promise that resolves to nothing
 *
 * @throws {Error} If the user does not exist
 * @throws {Error} If the password is invalid
 * @throws {Error} If there is an internal server error
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const accessToken = generateToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      refreshToken,
      refreshTokenCookieOptions
    );

    res.status(200).json({ token: accessToken });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Refresh a user's access token.
 *
 * @param {Request} req The request object
 * @param {Response} res The response object
 *
 * @returns {Promise<void>} A promise that resolves to nothing
 *
 * @throws {Error} If there is an internal server error
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (!refreshToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = await verifyRefreshToken(refreshToken);

    if (!userId) {
      //clear invalid cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: refreshTokenCookieOptions.path });
      return res
        .status(401)
        .json({ message: 'Unauthorized. Refresh token invalid' });
    }

    await invalidateRefreshToken(refreshToken);

    //Generate new tokens
    const accessToken = generateToken(userId);
    const newRefreshToken = await generateRefreshToken(userId);

    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      newRefreshToken,
      refreshTokenCookieOptions
    );

    res.status(200).json({ token: accessToken });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Logs out the user by invalidating the refresh token cookie.
 *
 * This function extracts the refresh token from the cookie, invalidates it,
 * and clears the cookie.
 *
 * @param {Request} req - The request object containing the refresh token cookie.
 * @param {Response} res - The response object used to send the HTTP response.
 *
 * @returns {Promise<void>} A promise that resolves to nothing.
 *
 * @throws {Error} If there is an internal server error.
 */
export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (refreshToken) {
    // Invalidate the refresh token
    await invalidateRefreshToken(refreshToken);
  }

  // Clear the cookie regardless of whether the token existed
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: refreshTokenCookieOptions.path });
  res.status(200).json({ message: 'Logged out successfully' });
};

/**
 * Logs out the user from all devices by invalidating all refresh tokens associated with the user.
 *
 * This function extracts the access token from the `Authorization` header, verifies it,
 * and uses the user ID from the token to invalidate all refresh tokens for that user.
 * It also clears the refresh token cookie and returns a success message.
 *
 * @param {Request} req - The request object containing headers and cookies.
 * @param {Response} res - The response object used to send the HTTP response.
 *
 * @returns {Promise<void>} A promise that resolves to nothing.
 *
 * @throws {Error} If the access token is missing or invalid, or if there is an internal server error.
 */
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers.authorization?.split(' ')[1];

    if (!accessToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = verifyToken(accessToken, TokenType.ACCESS);
    const userId = payload.userId;

    if (userId) {
      // Invalidate all refresh tokens for this user
      await invalidateAllUserRefreshTokens(userId);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: refreshTokenCookieOptions.path });    res
      .status(200)
      .json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
