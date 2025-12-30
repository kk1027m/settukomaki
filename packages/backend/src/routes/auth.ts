import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest,
  ],
  authController.login
);

router.get('/me', authenticate, authController.getMe);

router.put(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    validateRequest,
  ],
  authController.changePassword
);

router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validateRequest,
  ],
  authController.refreshAccessToken
);

export default router;
