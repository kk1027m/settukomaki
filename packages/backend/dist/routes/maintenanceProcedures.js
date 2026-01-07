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
const maintenanceProceduresController = __importStar(require("../controllers/maintenanceProceduresController"));
const auth_1 = require("../middleware/auth");
const validateRequest_1 = require("../middleware/validateRequest");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// GET routes - accessible by all authenticated users
router.get('/', maintenanceProceduresController.getProcedures);
router.get('/machines', maintenanceProceduresController.getMachineNames);
router.get('/units', maintenanceProceduresController.getUnitNames);
router.get('/:id', maintenanceProceduresController.getProcedure);
// Comment routes - all authenticated users can comment
router.post('/:procedure_id/comments', [
    (0, express_validator_1.body)('content').notEmpty().withMessage('コメント内容は必須です'),
    validateRequest_1.validateRequest,
], maintenanceProceduresController.createComment);
router.delete('/comments/:id', maintenanceProceduresController.deleteComment);
// POST, PUT, DELETE routes - admin only
router.post('/', auth_1.requireAdmin, [
    (0, express_validator_1.body)('title').notEmpty().withMessage('タイトルは必須です'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('内容は必須です'),
    (0, express_validator_1.body)('category').isIn(['machine', 'common']).withMessage('有効なカテゴリを選択してください'),
    validateRequest_1.validateRequest,
], maintenanceProceduresController.createProcedure);
router.put('/:id', auth_1.requireAdmin, [
    (0, express_validator_1.body)('title').notEmpty().withMessage('タイトルは必須です'),
    (0, express_validator_1.body)('content').notEmpty().withMessage('内容は必須です'),
    (0, express_validator_1.body)('category').isIn(['machine', 'common']).withMessage('有効なカテゴリを選択してください'),
    validateRequest_1.validateRequest,
], maintenanceProceduresController.updateProcedure);
router.delete('/:id', auth_1.requireAdmin, maintenanceProceduresController.deleteProcedure);
// Sort order route - admin only
router.put('/sort-order', auth_1.requireAdmin, maintenanceProceduresController.updateProcedureSortOrder);
exports.default = router;
//# sourceMappingURL=maintenanceProcedures.js.map