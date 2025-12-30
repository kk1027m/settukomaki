import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getReplacementSchedules,
  getReplacementScheduleById,
  createReplacementSchedule,
  updateReplacementSchedule,
  deleteReplacementSchedule,
  performReplacement,
  getReplacementRecords,
  getAlerts,
} from '../controllers/replacementController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Replacement schedules
router.get('/schedules', getReplacementSchedules);
router.get('/schedules/:id', getReplacementScheduleById);
router.post('/schedules', createReplacementSchedule);
router.put('/schedules/:id', updateReplacementSchedule);
router.delete('/schedules/:id', deleteReplacementSchedule);

// Replacement actions
router.post('/schedules/:id/perform', performReplacement);
router.get('/schedules/:id/records', getReplacementRecords);

// Alerts
router.get('/alerts', getAlerts);

export default router;
