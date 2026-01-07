import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/uploadHandler';
import { isCloudinaryConfigured } from '../config/cloudinary';

const router = Router();

// Debug endpoint to check Cloudinary configuration
router.get('/debug/config', (req, res) => {
  res.json({
    cloudinaryConfigured: isCloudinaryConfigured(),
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
  });
});

// Image retrieval doesn't require authentication (public access via image ID)
router.get('/:id', uploadController.getFile);

// All other routes require authentication
router.use(authenticate);

router.post(
  '/:entity_type/:entity_id',
  upload.single('file'),
  uploadController.uploadFile
);

router.get(
  '/entity/:entity_type/:entity_id',
  uploadController.getAttachmentsByEntity
);

router.delete('/:id', uploadController.deleteFile);

export default router;
