import { Router } from 'express';
import { body } from 'express-validator';
import * as inquiriesController from '../controllers/inquiriesController';
import { authenticate, requireLeaderOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - accessible by all authenticated users
router.get('/', inquiriesController.getInquiries);

// GET single inquiry with replies
router.get('/:id', inquiriesController.getInquiryById);

// POST route - accessible by all authenticated users
router.post(
  '/',
  [
    body('subject').notEmpty().withMessage('件名は必須です'),
    body('message').notEmpty().withMessage('内容は必須です'),
    validateRequest,
  ],
  inquiriesController.createInquiry
);

// PUT route for status - leader or admin only
router.put(
  '/:id/status',
  requireLeaderOrAdmin,
  [
    body('status').isIn(['pending', 'in_progress', 'resolved']).withMessage('無効なステータスです'),
    validateRequest,
  ],
  inquiriesController.updateInquiryStatus
);

// POST route for replies - leader or admin only
router.post(
  '/:id/replies',
  requireLeaderOrAdmin,
  [
    body('message').notEmpty().withMessage('返信内容は必須です'),
    validateRequest,
  ],
  inquiriesController.createReply
);

// DELETE route - leader or admin only
router.delete('/:id', requireLeaderOrAdmin, inquiriesController.deleteInquiry);

export default router;
