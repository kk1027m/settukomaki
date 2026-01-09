"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lineController_1 = require("../controllers/lineController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// LINE Webhook endpoint (no auth - called by LINE)
router.post('/webhook', lineController_1.handleWebhook);
// Cron endpoint (protected by secret)
router.get('/cron', lineController_1.runNotificationCron);
router.post('/cron', lineController_1.runNotificationCron);
// Admin endpoints
router.get('/status', auth_1.authenticate, auth_1.requireAdmin, lineController_1.getLineStatus);
router.post('/test', auth_1.authenticate, auth_1.requireAdmin, lineController_1.testLineConnection);
router.post('/trigger', auth_1.authenticate, auth_1.requireAdmin, lineController_1.triggerNotification);
router.delete('/recipients/:recipientId', auth_1.authenticate, auth_1.requireAdmin, lineController_1.deleteLineRecipient);
exports.default = router;
//# sourceMappingURL=line.js.map