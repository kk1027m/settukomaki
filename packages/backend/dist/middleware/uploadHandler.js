"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const storage_1 = require("../config/storage");
const cloudinary_1 = require("../config/cloudinary");
// Log storage configuration on startup
console.log('Upload configuration:', {
    uploadDir: storage_1.storageConfig.uploadDir,
    maxFileSize: storage_1.storageConfig.maxFileSize,
    allowedMimeTypes: storage_1.storageConfig.allowedMimeTypes,
    useCloudinary: (0, cloudinary_1.isCloudinaryConfigured)(),
});
// Ensure upload directory exists (safe for serverless) - only for local storage
const ensureUploadDir = () => {
    if ((0, cloudinary_1.isCloudinaryConfigured)())
        return; // Skip for Cloudinary
    try {
        if (!fs_1.default.existsSync(storage_1.storageConfig.uploadDir)) {
            fs_1.default.mkdirSync(storage_1.storageConfig.uploadDir, { recursive: true });
            console.log('Created upload directory:', storage_1.storageConfig.uploadDir);
        }
    }
    catch (error) {
        console.error('Failed to create upload directory:', storage_1.storageConfig.uploadDir, error);
    }
};
// Create directory on module load (only for local storage)
ensureUploadDir();
// Use memory storage for Cloudinary, disk storage for local
const storage = (0, cloudinary_1.isCloudinaryConfigured)()
    ? multer_1.default.memoryStorage()
    : multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            ensureUploadDir();
            cb(null, storage_1.storageConfig.uploadDir);
        },
        filename: (req, file, cb) => {
            const ext = path_1.default.extname(file.originalname);
            const filename = `${(0, uuid_1.v4)()}${ext}`;
            console.log('Saving file:', filename, 'to', storage_1.storageConfig.uploadDir);
            cb(null, filename);
        },
    });
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (!storage_1.storageConfig.allowedExtensions.includes(ext)) {
        console.log('File rejected - extension not allowed:', ext);
        return cb(new Error(`File type not allowed. Allowed types: ${storage_1.storageConfig.allowedExtensions.join(', ')}`));
    }
    if (!storage_1.storageConfig.allowedMimeTypes.includes(file.mimetype)) {
        console.log('File rejected - MIME type not allowed:', file.mimetype);
        return cb(new Error(`MIME type not allowed. Allowed types: ${storage_1.storageConfig.allowedMimeTypes.join(', ')}`));
    }
    cb(null, true);
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: storage_1.storageConfig.maxFileSize,
    },
});
//# sourceMappingURL=uploadHandler.js.map