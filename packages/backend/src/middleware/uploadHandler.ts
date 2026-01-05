import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { storageConfig } from '../config/storage';

// Log storage configuration on startup
console.log('Upload configuration:', {
  uploadDir: storageConfig.uploadDir,
  maxFileSize: storageConfig.maxFileSize,
  allowedMimeTypes: storageConfig.allowedMimeTypes,
  flyAppName: process.env.FLY_APP_NAME || 'not set',
  flyRegion: process.env.FLY_REGION || 'not set',
});

// Ensure upload directory exists (safe for serverless)
const ensureUploadDir = () => {
  try {
    if (!fs.existsSync(storageConfig.uploadDir)) {
      fs.mkdirSync(storageConfig.uploadDir, { recursive: true });
      console.log('Created upload directory:', storageConfig.uploadDir);
    }
  } catch (error) {
    console.error('Failed to create upload directory:', storageConfig.uploadDir, error);
  }
};

// Create directory on module load
ensureUploadDir();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before each upload (in case it was cleared)
    ensureUploadDir();
    cb(null, storageConfig.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    console.log('Saving file:', filename, 'to', storageConfig.uploadDir);
    cb(null, filename);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!storageConfig.allowedExtensions.includes(ext)) {
    console.log('File rejected - extension not allowed:', ext);
    return cb(new Error(`File type not allowed. Allowed types: ${storageConfig.allowedExtensions.join(', ')}`));
  }

  if (!storageConfig.allowedMimeTypes.includes(file.mimetype)) {
    console.log('File rejected - MIME type not allowed:', file.mimetype);
    return cb(new Error(`MIME type not allowed. Allowed types: ${storageConfig.allowedMimeTypes.join(', ')}`));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: storageConfig.maxFileSize,
  },
});
