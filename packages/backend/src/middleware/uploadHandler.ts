import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { storageConfig } from '../config/storage';

// Ensure upload directory exists
if (!fs.existsSync(storageConfig.uploadDir)) {
  fs.mkdirSync(storageConfig.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageConfig.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!storageConfig.allowedExtensions.includes(ext)) {
    return cb(new Error(`File type not allowed. Allowed types: ${storageConfig.allowedExtensions.join(', ')}`));
  }

  if (!storageConfig.allowedMimeTypes.includes(file.mimetype)) {
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
