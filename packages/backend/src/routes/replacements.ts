import { Router } from 'express';
import { authenticate, requireLeaderOrAdmin } from '../middleware/auth';
import {
  getReplacementSchedules,
  getReplacementScheduleById,
  createReplacementSchedule,
  updateReplacementSchedule,
  deleteReplacementSchedule,
  performReplacement,
  getReplacementRecords,
  getAlerts,
  updateReplacementSortOrder,
} from '../controllers/replacementController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Replacement schedules
router.get('/schedules', getReplacementSchedules);
router.put('/schedules/sort-order', requireLeaderOrAdmin, updateReplacementSortOrder);

router.get('/schedules/:id', getReplacementScheduleById);
router.post('/schedules', requireLeaderOrAdmin, createReplacementSchedule);
router.put('/schedules/:id', requireLeaderOrAdmin, updateReplacementSchedule);
router.delete('/schedules/:id', requireLeaderOrAdmin, deleteReplacementSchedule);

// Replacement actions
router.post('/schedules/:id/perform', requireLeaderOrAdmin, performReplacement);
router.get('/schedules/:id/records', getReplacementRecords);

// Alerts
router.get('/alerts', getAlerts);

export default router;
