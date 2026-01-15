import { Router } from 'express';
import { body } from 'express-validator';
import * as troubleshootingController from '../controllers/troubleshootingController';
import { authenticate, requireLeaderOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - accessible by all authenticated users
router.get('/items', troubleshootingController.getTroubleshootingItems);
router.get('/machines', troubleshootingController.getMachineNames);
router.get('/units', troubleshootingController.getUnitNames);
router.get('/items/:id', troubleshootingController.getTroubleshootingItemById);

// Sort order update - leader or admin only
router.put('/items/sort-order', requireLeaderOrAdmin, troubleshootingController.updateTroubleshootingSortOrder);

// POST, PUT, DELETE routes - leader or admin only
router.post(
  '/items',
  requireLeaderOrAdmin,
  [
    body('machine_name').notEmpty().withMessage('機械名は必須です'),
    body('trouble_title').notEmpty().withMessage('トラブル内容は必須です'),
    validateRequest,
  ],
  troubleshootingController.createTroubleshootingItem
);

router.put(
  '/items/:id',
  requireLeaderOrAdmin,
  troubleshootingController.updateTroubleshootingItem
);

router.delete('/items/:id', requireLeaderOrAdmin, troubleshootingController.deleteTroubleshootingItem);

export default router;
