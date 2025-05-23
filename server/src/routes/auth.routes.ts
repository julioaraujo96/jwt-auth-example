import { Router } from 'express';
import {
  register,
  login,
  logout,
  logoutAll,
  refreshAccessToken,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAll);

export default router;
