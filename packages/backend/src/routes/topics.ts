import { Router } from 'express';
import { body } from 'express-validator';
import * as topicsController from '../controllers/topicsController';
import { authenticate, requireLeaderOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - accessible by all authenticated users
router.get('/', topicsController.getTopics);
router.get('/:id', topicsController.getTopic);

// POST, PUT, DELETE routes - leader or admin only
router.post(
  '/',
  requireLeaderOrAdmin,
  [
    body('title').notEmpty().withMessage('タイトルは必須です'),
    body('content').notEmpty().withMessage('内容は必須です'),
    validateRequest,
  ],
  topicsController.createTopic
);

router.put(
  '/:id',
  requireLeaderOrAdmin,
  [
    body('title').notEmpty().withMessage('タイトルは必須です'),
    body('content').notEmpty().withMessage('内容は必須です'),
    validateRequest,
  ],
  topicsController.updateTopic
);

router.delete('/:id', requireLeaderOrAdmin, topicsController.deleteTopic);

export default router;
