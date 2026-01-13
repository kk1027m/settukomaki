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

export default router;
