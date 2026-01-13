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
const calendarController = __importStar(require("../controllers/calendarController"));
const auth_1 = require("../middleware/auth");
const validateRequest_1 = require("../middleware/validateRequest");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// GET routes - accessible by all authenticated users
router.get('/events', calendarController.getEvents);
router.get('/day-colors', calendarController.getDayColors);
// POST, PUT, DELETE routes - leader or admin only
router.post('/events', auth_1.requireLeaderOrAdmin, [
    (0, express_validator_1.body)('date').notEmpty().withMessage('日付は必須です'),
    (0, express_validator_1.body)('title').notEmpty().withMessage('タイトルは必須です'),
    validateRequest_1.validateRequest,
], calendarController.createEvent);
router.put('/events/:id', auth_1.requireLeaderOrAdmin, calendarController.updateEvent);
router.delete('/events/:id', auth_1.requireLeaderOrAdmin, calendarController.deleteEvent);
// Day color setting - leader or admin only
router.post('/day-colors', auth_1.requireLeaderOrAdmin, [
    (0, express_validator_1.body)('date').notEmpty().withMessage('日付は必須です'),
    validateRequest_1.validateRequest,
], calendarController.setDayColor);
exports.default = router;
//# sourceMappingURL=calendar.js.map