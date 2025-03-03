import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { JWTPayload, TokenType } from '../types/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT.
 *
 * This function extracts the JWT from the `Authorization` header, verifies it,
 * and attaches the decoded payload to the request object as `req.user`.
 * If the token is missing or invalid, it responds with a 401 status.
 *
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = verifyToken(token, TokenType.ACCESS) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};
