import { Router } from 'express';
import { body } from 'express-validator';
import * as calendarController from '../controllers/calendarController';
import { authenticate, requireLeaderOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET routes - accessible by all authenticated users
router.get('/events', calendarController.getEvents);
router.get('/day-colors', calendarController.getDayColors);

// POST, PUT, DELETE routes - leader or admin only
router.post(
  '/events',
  requireLeaderOrAdmin,
  [
    body('date').notEmpty().withMessage('日付は必須です'),
    body('title').notEmpty().withMessage('タイトルは必須です'),
    validateRequest,
  ],
  calendarController.createEvent
);

router.put(
  '/events/:id',
  requireLeaderOrAdmin,
  calendarController.updateEvent
);

router.delete('/events/:id', requireLeaderOrAdmin, calendarController.deleteEvent);

// Day color setting - leader or admin only
router.post(
  '/day-colors',
  requireLeaderOrAdmin,
  [
    body('date').notEmpty().withMessage('日付は必須です'),
    validateRequest,
  ],
  calendarController.setDayColor
);

// Week shift routes (A班/B班)
router.get('/week-shifts', calendarController.getWeekShifts);

router.post(
  '/week-shifts',
  requireLeaderOrAdmin,
  [
    body('sundayDate').notEmpty().withMessage('日曜日の日付は必須です'),
    body('shift').isIn(['A', 'B']).withMessage('シフトはAまたはBを指定してください'),
    validateRequest,
  ],
  calendarController.updateWeekShift
);

// Leaves routes (有給休暇)
router.get('/leaves', calendarController.getLeaves);

router.post(
  '/leaves',
  requireLeaderOrAdmin,
  [
    body('date').notEmpty().withMessage('日付は必須です'),
    body('employee_name').notEmpty().withMessage('名前は必須です'),
    validateRequest,
  ],
  calendarController.createLeave
);

router.delete('/leaves/:id', requireLeaderOrAdmin, calendarController.deleteLeave);

export default router;
