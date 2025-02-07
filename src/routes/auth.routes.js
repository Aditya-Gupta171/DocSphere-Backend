import express from 'express';
import { 
  signup, 
  signin, 
  refreshToken, 
  logout,
  getProfile,
} from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/refresh-token', refreshToken);

// Protected routes
router.use(authMiddleware);
router.post('/logout', logout);
router.get('/profile', getProfile);

export default router;