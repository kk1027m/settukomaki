import path from 'path';

// Use /tmp directory on serverless/containerized environments, otherwise use local uploads directory
const getUploadDir = () => {
  // Vercel serverless
  if (process.env.VERCEL === '1') {
    return '/tmp/uploads';
  }
  // Fly.io (detect by FLY_APP_NAME or FLY_REGION env vars)
  if (process.env.FLY_APP_NAME || process.env.FLY_REGION) {
    return '/tmp/uploads';
  }
  return process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
};

export const storageConfig = {
  uploadDir: getUploadDir(),
  // 4MB limit to stay under Vercel's 4.5MB serverless function body size limit
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '4194304'), // 4MB
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
};
