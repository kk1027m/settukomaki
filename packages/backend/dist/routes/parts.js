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
const partController = __importStar(require("../controllers/partController"));
const auth_1 = require("../middleware/auth");
const validateRequest_1 = require("../middleware/validateRequest");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
router.get('/', partController.getParts);
router.get('/low-stock', partController.getLowStockParts);
router.get('/order-requests', partController.getOrderRequests);
router.put('/sort-order', auth_1.requireLeaderOrAdmin, partController.updateSortOrder);
router.get('/:id', partController.getPartById);
router.post('/', auth_1.requireLeaderOrAdmin, [
    (0, express_validator_1.body)('part_name').notEmpty().withMessage('Part name is required'),
    (0, express_validator_1.body)('current_stock').isInt({ min: 0 }).withMessage('Current stock must be a non-negative integer'),
    (0, express_validator_1.body)('min_stock').isInt({ min: 0 }).withMessage('Min stock must be a non-negative integer'),
    (0, express_validator_1.body)('unit').notEmpty().withMessage('Unit is required'),
    validateRequest_1.validateRequest,
], partController.createPart);
router.put('/:id', auth_1.requireLeaderOrAdmin, partController.updatePart);
router.delete('/:id', auth_1.requireLeaderOrAdmin, partController.deletePart);
router.post('/:id/adjust', auth_1.requireLeaderOrAdmin, [
    (0, express_validator_1.body)('action_type').isIn(['入庫', '出庫']).withMessage('Invalid action type'),
    (0, express_validator_1.body)('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    validateRequest_1.validateRequest,
], partController.adjustStock);
router.get('/:id/history', partController.getPartHistory);
router.post('/:id/order', auth_1.requireLeaderOrAdmin, [
    (0, express_validator_1.body)('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    (0, express_validator_1.body)('urgency').isIn(['normal', 'urgent']).withMessage('Urgency must be normal or urgent'),
    validateRequest_1.validateRequest,
], partController.orderRequest);
exports.default = router;
//# sourceMappingURL=parts.js.map