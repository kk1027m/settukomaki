"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMultipleSettings = exports.updateSetting = exports.getSetting = exports.getSettings = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const schedulerService_1 = require("../services/schedulerService");
const getSettings = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)('SELECT * FROM settings ORDER BY key');
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSettings = getSettings;
const getSetting = async (req, res, next) => {
    try {
        const { key } = req.params;
        const result = await (0, connection_1.query)('SELECT * FROM settings WHERE key = $1', [key]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Setting not found', 404);
        }
        res.json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSetting = getSetting;
const updateSetting = async (req, res, next) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        // Validate time format for notification settings
        if (key.startsWith('notification_') && key.endsWith('_time')) {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(value)) {
                throw new errorHandler_1.AppError('Invalid time format. Use HH:MM format (e.g., 08:00)', 400);
            }
        }
        const result = await (0, connection_1.query)(`UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP
       WHERE key = $2
       RETURNING *`, [value, key]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Setting not found', 404);
        }
        // Restart scheduler if notification time was changed
        if (key.startsWith('notification_') && key.endsWith('_time')) {
            (0, schedulerService_1.restartScheduler)();
        }
        res.json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSetting = updateSetting;
const updateMultipleSettings = async (req, res, next) => {
    try {
        const { settings } = req.body;
        if (!Array.isArray(settings)) {
            throw new errorHandler_1.AppError('Settings must be an array', 400);
        }
        const results = [];
        let shouldRestartScheduler = false;
        for (const setting of settings) {
            const { key, value } = setting;
            // Validate time format for notification settings
            if (key.startsWith('notification_') && key.endsWith('_time')) {
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                if (!timeRegex.test(value)) {
                    throw new errorHandler_1.AppError(`Invalid time format for ${key}. Use HH:MM format (e.g., 08:00)`, 400);
                }
                shouldRestartScheduler = true;
            }
            const result = await (0, connection_1.query)(`UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP
         WHERE key = $2
         RETURNING *`, [value, key]);
            if (result.rows.length > 0) {
                results.push(result.rows[0]);
            }
        }
        // Restart scheduler if any notification time was changed
        if (shouldRestartScheduler) {
            (0, schedulerService_1.restartScheduler)();
        }
        res.json({
            success: true,
            data: results,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMultipleSettings = updateMultipleSettings;
//# sourceMappingURL=settingsController.js.map