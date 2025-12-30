import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  getSettings,
  getSetting,
  updateSetting,
  updateMultipleSettings,
} from '../controllers/settingsController';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

router.get('/', getSettings);
router.get('/:key', getSetting);
router.put('/:key', updateSetting);
router.put('/', updateMultipleSettings);

export default router;
