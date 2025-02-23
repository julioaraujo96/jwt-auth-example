import { Request, Response } from 'express';

export const profile = async (req: Request, res: Response) => {
  try {
    res
      .status(200)
      .json({ message: 'This is a protected profile route', user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
