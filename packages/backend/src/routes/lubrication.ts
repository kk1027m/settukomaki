import { Router } from 'express';
import { body } from 'express-validator';
import * as lubricationController from '../controllers/lubricationController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/points', lubricationController.getLubricationPoints);

router.get('/points/:id', lubricationController.getLubricationPointById);

router.post(
  '/points',
  [
    body('machine_name').notEmpty().withMessage('Machine name is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('cycle_days').isInt({ min: 1 }).withMessage('Cycle days must be a positive integer'),
    validateRequest,
  ],
  lubricationController.createLubricationPoint
);

router.put('/points/:id', lubricationController.updateLubricationPoint);

router.delete('/points/:id', lubricationController.deleteLubricationPoint);

router.post(
  '/points/:id/perform',
  lubricationController.performLubrication
);

router.get('/points/:id/records', lubricationController.getLubricationRecords);

router.get('/alerts', lubricationController.getAlerts);

export default router;
