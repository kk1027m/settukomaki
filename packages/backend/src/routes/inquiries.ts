import { Router } from 'express';
import { body } from 'express-validator';
import * as inquiriesController from '../controllers/inquiriesController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - accessible by all authenticated users
router.get('/', inquiriesController.getInquiries);

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

// PUT route for status - admin only
router.put(
  '/:id/status',
  requireAdmin,
  [
    body('status').isIn(['pending', 'in_progress', 'resolved']).withMessage('無効なステータスです'),
    validateRequest,
  ],
  inquiriesController.updateInquiryStatus
);

export default router;
