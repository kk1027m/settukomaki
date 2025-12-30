import { Router } from 'express';
import { body } from 'express-validator';
import * as topicsController from '../controllers/topicsController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - accessible by all authenticated users
router.get('/', topicsController.getTopics);
router.get('/:id', topicsController.getTopic);

// POST, PUT, DELETE routes - admin only
router.post(
  '/',
  requireAdmin,
  [
    body('title').notEmpty().withMessage('タイトルは必須です'),
    body('content').notEmpty().withMessage('内容は必須です'),
    validateRequest,
  ],
  topicsController.createTopic
);

router.put(
  '/:id',
  requireAdmin,
  [
    body('title').notEmpty().withMessage('タイトルは必須です'),
    body('content').notEmpty().withMessage('内容は必須です'),
    validateRequest,
  ],
  topicsController.updateTopic
);

router.delete('/:id', requireAdmin, topicsController.deleteTopic);

export default router;
