import { Router } from 'express';
import { body } from 'express-validator';
import * as partController from '../controllers/partController';
import { authenticate, requireLeaderOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', partController.getParts);

router.get('/low-stock', partController.getLowStockParts);

router.get('/order-requests', partController.getOrderRequests);

router.put('/sort-order', requireLeaderOrAdmin, partController.updateSortOrder);

router.get('/:id', partController.getPartById);

router.post(
  '/',
  requireLeaderOrAdmin,
  [
    body('part_name').notEmpty().withMessage('Part name is required'),
    body('current_stock').isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer'),
    body('min_stock').isInt({ min: 0 }).withMessage('Min stock must be a non-negative integer'),
    body('unit').notEmpty().withMessage('Unit is required'),
    validateRequest,
  ],
  partController.createPart
);

router.put('/:id', requireLeaderOrAdmin, partController.updatePart);

router.delete('/:id', requireLeaderOrAdmin, partController.deletePart);

router.post(
  '/:id/adjust',
  requireLeaderOrAdmin,
  [
    body('action_type').isIn(['入庫', '出庫']).withMessage('Invalid action type'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    validateRequest,
  ],
  partController.adjustStock
);

router.get('/:id/history', partController.getPartHistory);

router.post(
  '/:id/order',
  requireLeaderOrAdmin,
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('urgency').isIn(['normal', 'urgent']).withMessage('Urgency must be normal or urgent'),
    validateRequest,
  ],
  partController.orderRequest
);

export default router;
