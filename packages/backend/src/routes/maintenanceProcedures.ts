import { Router } from 'express';
import { body } from 'express-validator';
import * as maintenanceProceduresController from '../controllers/maintenanceProceduresController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - accessible by all authenticated users
router.get('/', maintenanceProceduresController.getProcedures);
router.get('/machines', maintenanceProceduresController.getMachineNames);
router.get('/units', maintenanceProceduresController.getUnitNames);
router.get('/:id', maintenanceProceduresController.getProcedure);

// Comment routes - all authenticated users can comment
router.post(
  '/:procedure_id/comments',
  [
    body('content').notEmpty().withMessage('コメント内容は必須です'),
    validateRequest,
  ],
  maintenanceProceduresController.createComment
);

router.delete(
  '/comments/:id',
  maintenanceProceduresController.deleteComment
);

// POST, PUT, DELETE routes - admin only
router.post(
  '/',
  requireAdmin,
  [
    body('title').notEmpty().withMessage('タイトルは必須です'),
    body('content').notEmpty().withMessage('内容は必須です'),
    body('category').isIn(['machine', 'common']).withMessage('有効なカテゴリを選択してください'),
    validateRequest,
  ],
  maintenanceProceduresController.createProcedure
);

router.put(
  '/:id',
  requireAdmin,
  [
    body('title').notEmpty().withMessage('タイトルは必須です'),
    body('content').notEmpty().withMessage('内容は必須です'),
    body('category').isIn(['machine', 'common']).withMessage('有効なカテゴリを選択してください'),
    validateRequest,
  ],
  maintenanceProceduresController.updateProcedure
);

router.delete('/:id', requireAdmin, maintenanceProceduresController.deleteProcedure);

export default router;
