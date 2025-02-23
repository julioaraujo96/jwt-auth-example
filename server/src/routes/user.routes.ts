import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/profile', authenticate, (req, res) => {
  res.json({ message: 'This is a protected profile route', user: req.user });
});

export default router;
