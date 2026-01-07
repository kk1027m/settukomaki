"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController = __importStar(require("../controllers/uploadController"));
const auth_1 = require("../middleware/auth");
const uploadHandler_1 = require("../middleware/uploadHandler");
const cloudinary_1 = require("../config/cloudinary");
const router = (0, express_1.Router)();
// Debug endpoint to check Cloudinary configuration
router.get('/debug/config', (req, res) => {
    res.json({
        cloudinaryConfigured: (0, cloudinary_1.isCloudinaryConfigured)(),
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    });
});
// Image retrieval doesn't require authentication (public access via image ID)
router.get('/:id', uploadController.getFile);
// All other routes require authentication
router.use(auth_1.authenticate);
router.post('/:entity_type/:entity_id', uploadHandler_1.upload.single('file'), uploadController.uploadFile);
router.get('/entity/:entity_type/:entity_id', uploadController.getAttachmentsByEntity);
router.delete('/:id', uploadController.deleteFile);
exports.default = router;
//# sourceMappingURL=uploads.js.map