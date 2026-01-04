import path from 'path';

// Use /tmp directory on Vercel serverless, otherwise use local uploads directory
const getUploadDir = () => {
  if (process.env.VERCEL === '1') {
    return '/tmp/uploads';
  }
  return process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
};

export const storageConfig = {
  uploadDir: getUploadDir(),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
};
