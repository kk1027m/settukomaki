"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const settingsController_1 = require("../controllers/settingsController");
const router = (0, express_1.Router)();
// All routes require authentication and admin role
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
router.get('/', settingsController_1.getSettings);
router.get('/:key', settingsController_1.getSetting);
router.put('/:key', settingsController_1.updateSetting);
router.put('/', settingsController_1.updateMultipleSettings);
exports.default = router;
//# sourceMappingURL=settings.js.map