"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLineRecipient = exports.testLineConnection = exports.getLineStatus = exports.triggerNotification = exports.runNotificationCron = exports.handleWebhook = void 0;
const connection_1 = require("../database/connection");
const lineService_1 = require("../services/lineService");
// LINE Webhook handler - receives events from LINE
const handleWebhook = async (req, res) => {
    try {
        const events = req.body.events || [];
        for (const event of events) {
            console.log('LINE event received:', event.type, event.source);
            // When bot joins a group, save the group ID
            if (event.type === 'join' && event.source.type === 'group') {
                const groupId = event.source.groupId;
                console.log('Bot joined group:', groupId);
                await (0, lineService_1.saveLineGroupId)(groupId, 'group');
            }
            // When bot leaves a group, deactivate the recipient
            if (event.type === 'leave' && event.source.type === 'group') {
                const groupId = event.source.groupId;
                console.log('Bot left group:', groupId);
                await (0, lineService_1.removeLineRecipient)(groupId);
            }
            // Capture group ID from any message in a group (always save/update)
            if (event.source.type === 'group' && event.source.groupId) {
                const groupId = event.source.groupId;
                console.log('Saving/updating group ID from message event:', groupId);
                await (0, lineService_1.saveLineGroupId)(groupId, 'group');
            }
            // Capture user ID from 1:1 chat (always save/update)
            if (event.source.type === 'user' && event.source.userId) {
                const userId = event.source.userId;
                console.log('Saving/updating user ID from 1:1 chat:', userId);
                await (0, lineService_1.saveLineGroupId)(userId, 'user');
            }
        }
        // LINE expects 200 OK response
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(200).json({ success: true }); // Still return 200 to LINE
    }
};
exports.handleWebhook = handleWebhook;
// Cron job endpoint - called by Vercel Cron
const runNotificationCron = async (req, res) => {
    try {
        // Verify cron secret to prevent unauthorized access
        const authHeader = req.headers['authorization'];
        const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        const cronSecret = bearerToken || req.headers['x-cron-secret'] || req.query.secret;
        if (cronSecret !== process.env.CRON_SECRET) {
            console.log('Invalid cron secret');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Check if today is a weekday in Japan timezone (Monday = 1, Sunday = 0)
        const japanTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
        const dayOfWeek = japanTime.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            console.log('Skipping notification - weekend (Japan time)');
            return res.json({ success: true, message: 'Skipped - weekend' });
        }
        const result = await checkAndSendNotifications();
        res.json(result);
    }
    catch (error) {
        console.error('Cron error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.runNotificationCron = runNotificationCron;
// Manual trigger for testing
const triggerNotification = async (req, res) => {
    try {
        const result = await checkAndSendNotifications();
        res.json(result);
    }
    catch (error) {
        console.error('Manual trigger error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.triggerNotification = triggerNotification;
// Check all conditions and send LINE notification
const checkAndSendNotifications = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    // Urgent lubrication (within 3 days)
    // Get the latest record per lubrication point
    const urgentLubricationResult = await (0, connection_1.query)(`SELECT DISTINCT ON (lp.id)
       lp.id, lp.machine_name, lp.location as point_name, lr.next_due_date as next_date
     FROM lubrication_points lp
     JOIN lubrication_records lr ON lr.point_id = lp.id
     WHERE lp.is_active = true
       AND lr.next_due_date <= $1
       AND lr.next_due_date >= $2
     ORDER BY lp.id, lr.performed_at DESC`, [threeDaysFromNow.toISOString().split('T')[0], today.toISOString().split('T')[0]]);
    // Scheduled lubrication (4-7 days)
    const scheduledLubricationResult = await (0, connection_1.query)(`SELECT DISTINCT ON (lp.id)
       lp.id, lp.machine_name, lp.location as point_name, lr.next_due_date as next_date
     FROM lubrication_points lp
     JOIN lubrication_records lr ON lr.point_id = lp.id
     WHERE lp.is_active = true
       AND lr.next_due_date > $1
       AND lr.next_due_date <= $2
     ORDER BY lp.id, lr.performed_at DESC`, [threeDaysFromNow.toISOString().split('T')[0], sevenDaysFromNow.toISOString().split('T')[0]]);
    // Urgent replacement (within 3 days)
    const urgentReplacementResult = await (0, connection_1.query)(`SELECT DISTINCT ON (rs.id)
       rs.id, rs.machine_name, rs.part_name, rr.next_due_date as next_replacement_date
     FROM replacement_schedules rs
     JOIN replacement_records rr ON rr.schedule_id = rs.id
     WHERE rs.is_active = true
       AND rr.next_due_date <= $1
       AND rr.next_due_date >= $2
     ORDER BY rs.id, rr.replaced_at DESC`, [threeDaysFromNow.toISOString().split('T')[0], today.toISOString().split('T')[0]]);
    // Scheduled replacement (4-7 days)
    const scheduledReplacementResult = await (0, connection_1.query)(`SELECT DISTINCT ON (rs.id)
       rs.id, rs.machine_name, rs.part_name, rr.next_due_date as next_replacement_date
     FROM replacement_schedules rs
     JOIN replacement_records rr ON rr.schedule_id = rs.id
     WHERE rs.is_active = true
       AND rr.next_due_date > $1
       AND rr.next_due_date <= $2
     ORDER BY rs.id, rr.replaced_at DESC`, [threeDaysFromNow.toISOString().split('T')[0], sevenDaysFromNow.toISOString().split('T')[0]]);
    // Low stock parts
    const lowStockResult = await (0, connection_1.query)(`SELECT part_name, current_stock as quantity, min_stock as minimum_quantity
     FROM parts
     WHERE is_active = true AND current_stock < min_stock
     ORDER BY part_name ASC`);
    const message = (0, lineService_1.formatNotificationMessage)(urgentLubricationResult.rows, scheduledLubricationResult.rows, urgentReplacementResult.rows, scheduledReplacementResult.rows, lowStockResult.rows);
    if (!message) {
        console.log('No notifications to send');
        return { success: true, message: 'No notifications needed' };
    }
    const sent = await (0, lineService_1.sendLineMessage)(message);
    return {
        success: sent,
        message: sent ? 'Notification sent' : 'Failed to send notification',
        counts: {
            urgentLubrication: urgentLubricationResult.rows.length,
            scheduledLubrication: scheduledLubricationResult.rows.length,
            urgentReplacement: urgentReplacementResult.rows.length,
            scheduledReplacement: scheduledReplacementResult.rows.length,
            lowStock: lowStockResult.rows.length,
        },
    };
};
// Get current LINE settings status
const getLineStatus = async (req, res) => {
    try {
        const settings = await (0, lineService_1.getLineSettings)();
        const recipients = await (0, lineService_1.getLineRecipients)();
        res.json({
            success: true,
            data: {
                hasToken: !!settings.channelAccessToken,
                hasGroupId: recipients.length > 0,
                recipientCount: recipients.length,
                recipients: recipients.map(r => ({
                    id: r.recipient_id,
                    displayId: r.recipient_id.slice(-8),
                    type: r.recipient_type,
                    name: r.name,
                })),
            },
        });
    }
    catch (error) {
        console.error('Get LINE status error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLineStatus = getLineStatus;
// Test LINE connection
const testLineConnection = async (req, res) => {
    try {
        const sent = await (0, lineService_1.sendLineMessage)('🔔 テスト通知\n\nLINE通知の接続テストです。このメッセージが届いていれば、設定は正常です。');
        res.json({
            success: sent,
            message: sent ? 'Test message sent' : 'Failed to send test message',
        });
    }
    catch (error) {
        console.error('Test LINE connection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.testLineConnection = testLineConnection;
// Delete LINE recipient
const deleteLineRecipient = async (req, res) => {
    try {
        const { recipientId } = req.params;
        if (!recipientId) {
            return res.status(400).json({ error: 'Recipient ID is required' });
        }
        await (0, lineService_1.removeLineRecipient)(recipientId);
        res.json({ success: true, message: 'Recipient removed' });
    }
    catch (error) {
        console.error('Delete LINE recipient error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteLineRecipient = deleteLineRecipient;
//# sourceMappingURL=lineController.js.map