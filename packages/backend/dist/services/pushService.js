"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushToUser = sendPushToUser;
exports.sendPushToAll = sendPushToAll;
exports.sendPushToAdmins = sendPushToAdmins;
const web_push_1 = __importDefault(require("web-push"));
const connection_1 = require("../database/connection");
const logger_1 = require("../utils/logger");
// Initialize web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    web_push_1.default.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@sets-carton.co.jp', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}
async function sendPushToUser(userId, payload) {
    try {
        // Get active subscriptions for user
        const result = await (0, connection_1.query)('SELECT * FROM push_subscriptions WHERE user_id = $1 AND is_active = true', [userId]);
        const promises = result.rows.map(async (subscription) => {
            try {
                await web_push_1.default.sendNotification({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth,
                    },
                }, JSON.stringify(payload));
                logger_1.logger.info(`Push notification sent to user ${userId}`);
            }
            catch (error) {
                logger_1.logger.error(`Failed to send push to subscription ${subscription.id}:`, error);
                // If subscription is invalid, deactivate it
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await (0, connection_1.query)('UPDATE push_subscriptions SET is_active = false WHERE id = $1', [subscription.id]);
                }
            }
        });
        await Promise.all(promises);
    }
    catch (error) {
        logger_1.logger.error(`Error sending push to user ${userId}:`, error);
    }
}
async function sendPushToAll(payload) {
    try {
        const result = await (0, connection_1.query)('SELECT DISTINCT user_id FROM push_subscriptions WHERE is_active = true');
        const promises = result.rows.map((row) => sendPushToUser(row.user_id, payload));
        await Promise.all(promises);
    }
    catch (error) {
        logger_1.logger.error('Error sending push to all users:', error);
    }
}
async function sendPushToAdmins(payload) {
    try {
        const result = await (0, connection_1.query)(`SELECT DISTINCT ps.user_id
       FROM push_subscriptions ps
       JOIN users u ON ps.user_id = u.id
       WHERE ps.is_active = true AND u.role = 'admin'`);
        const promises = result.rows.map((row) => sendPushToUser(row.user_id, payload));
        await Promise.all(promises);
    }
    catch (error) {
        logger_1.logger.error('Error sending push to admins:', error);
    }
}
//# sourceMappingURL=pushService.js.map