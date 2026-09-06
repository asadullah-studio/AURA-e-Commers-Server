import { Router } from 'express';
import {
  getMe,
  register,
  login,
  logout,
} from '../controllers/authController.js';

const router = Router();

router.get('/me', getMe);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

export default router;
