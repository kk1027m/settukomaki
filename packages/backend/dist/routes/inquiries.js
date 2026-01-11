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
const express_validator_1 = require("express-validator");
const inquiriesController = __importStar(require("../controllers/inquiriesController"));
const auth_1 = require("../middleware/auth");
const validateRequest_1 = require("../middleware/validateRequest");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// GET routes - accessible by all authenticated users
router.get('/', inquiriesController.getInquiries);
// GET single inquiry with replies
router.get('/:id', inquiriesController.getInquiryById);
// POST route - accessible by all authenticated users
router.post('/', [
    (0, express_validator_1.body)('subject').notEmpty().withMessage('件名は必須です'),
    (0, express_validator_1.body)('message').notEmpty().withMessage('内容は必須です'),
    validateRequest_1.validateRequest,
], inquiriesController.createInquiry);
// PUT route for status - leader or admin only
router.put('/:id/status', auth_1.requireLeaderOrAdmin, [
    (0, express_validator_1.body)('status').isIn(['pending', 'in_progress', 'resolved']).withMessage('無効なステータスです'),
    validateRequest_1.validateRequest,
], inquiriesController.updateInquiryStatus);
// POST route for replies - leader or admin only
router.post('/:id/replies', auth_1.requireLeaderOrAdmin, [
    (0, express_validator_1.body)('message').notEmpty().withMessage('返信内容は必須です'),
    validateRequest_1.validateRequest,
], inquiriesController.createReply);
exports.default = router;
//# sourceMappingURL=inquiries.js.map