import { Router } from 'express';
import {
  handleWebhook,
  runNotificationCron,
  triggerNotification,
  getLineStatus,
  testLineConnection,
  deleteLineRecipient,
} from '../controllers/lineController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// LINE Webhook endpoint (no auth - called by LINE)
router.post('/webhook', handleWebhook);

// Cron endpoint (protected by secret)
router.get('/cron', runNotificationCron);
router.post('/cron', runNotificationCron);

// Admin endpoints
router.get('/status', authenticate, requireAdmin, getLineStatus);
router.post('/test', authenticate, requireAdmin, testLineConnection);
router.post('/trigger', authenticate, requireAdmin, triggerNotification);
router.delete('/recipients/:recipientId', authenticate, requireAdmin, deleteLineRecipient);

export default router;
