import { userRepository } from './../repositories/user.repo';
import { generateToken } from '../utils/jwt';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10');

/**
 * Register endpoint.
 *
 * Registers a new user with the given email and password.
 * If the email already exists, it returns a 400 status with a message.
 * If the combination is valid, it generates a JWT token and returns it.
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

    const token = generateToken(user.id);

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Login endpoint.
 *
 * Checks if the given email and password combination is valid.
 * If the combination is valid, it generates a JWT token and returns it.
 * The token can be used to authenticate requests to protected routes.
 * If the combination is invalid, it returns a 401 status.
 * If an unexpected error occurs, it returns a 500 status.
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

    const token = generateToken(user.id);

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
