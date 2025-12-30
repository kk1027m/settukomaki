import { Router } from 'express';
import { body } from 'express-validator';
import * as notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', notificationController.getNotifications);

router.get('/unread-count', notificationController.getUnreadCount);

router.patch('/:id/read', notificationController.markAsRead);

router.patch('/mark-all-read', notificationController.markAllAsRead);

router.delete('/:id', notificationController.deleteNotification);

router.post(
  '/subscribe',
  [
    body('endpoint').notEmpty().withMessage('Endpoint is required'),
    body('p256dh').notEmpty().withMessage('p256dh key is required'),
    body('auth').notEmpty().withMessage('Auth key is required'),
    validateRequest,
  ],
  notificationController.subscribePush
);

router.post(
  '/unsubscribe',
  [
    body('endpoint').notEmpty().withMessage('Endpoint is required'),
    validateRequest,
  ],
  notificationController.unsubscribePush
);

export default router;
