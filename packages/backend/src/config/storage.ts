import path from 'path';

export const storageConfig = {
  uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
};
