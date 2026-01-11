"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const replacementController_1 = require("../controllers/replacementController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Replacement schedules
router.get('/schedules', replacementController_1.getReplacementSchedules);
router.put('/schedules/sort-order', auth_1.requireLeaderOrAdmin, replacementController_1.updateReplacementSortOrder);
router.get('/schedules/:id', replacementController_1.getReplacementScheduleById);
router.post('/schedules', auth_1.requireLeaderOrAdmin, replacementController_1.createReplacementSchedule);
router.put('/schedules/:id', auth_1.requireLeaderOrAdmin, replacementController_1.updateReplacementSchedule);
router.delete('/schedules/:id', auth_1.requireLeaderOrAdmin, replacementController_1.deleteReplacementSchedule);
// Replacement actions
router.post('/schedules/:id/perform', auth_1.requireLeaderOrAdmin, replacementController_1.performReplacement);
router.get('/schedules/:id/records', replacementController_1.getReplacementRecords);
// Alerts
router.get('/alerts', replacementController_1.getAlerts);
exports.default = router;
//# sourceMappingURL=replacements.js.map