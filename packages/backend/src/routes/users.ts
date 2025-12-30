import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

router.get('/', userController.getUsers);

router.get('/:id', userController.getUserById);

router.post(
  '/',
  [
    body('username').isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['admin', 'user']).withMessage('Role must be admin or user'),
    validateRequest,
  ],
  userController.createUser
);

router.put('/:id', userController.updateUser);

router.delete('/:id', userController.deleteUser);

export default router;
