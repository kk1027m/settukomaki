"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNotificationMessage = exports.sendLineMessage = exports.removeLineRecipient = exports.saveLineGroupId = exports.getLineRecipients = exports.getLineSettings = void 0;
const connection_1 = require("../database/connection");
const LINE_MESSAGING_API_URL = 'https://api.line.me/v2/bot/message/push';
// Get LINE settings (token from env, check if any recipients exist)
const getLineSettings = async () => {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || null;
    // Check if there are any active recipients
    const recipientsResult = await (0, connection_1.query)('SELECT recipient_id FROM line_recipients WHERE is_active = true LIMIT 1');
    return {
        channelAccessToken,
        groupId: recipientsResult.rows[0]?.recipient_id || null,
    };
};
exports.getLineSettings = getLineSettings;
// Get all active LINE recipients
const getLineRecipients = async () => {
    const result = await (0, connection_1.query)('SELECT * FROM line_recipients WHERE is_active = true ORDER BY created_at ASC');
    return result.rows;
};
exports.getLineRecipients = getLineRecipients;
// Save LINE recipient (group or user) to database
const saveLineGroupId = async (recipientId, recipientType = 'group', name) => {
    await (0, connection_1.query)(`INSERT INTO line_recipients (recipient_id, recipient_type, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (recipient_id) DO UPDATE SET
       recipient_type = $2,
       name = COALESCE($3, line_recipients.name),
       is_active = true,
       updated_at = CURRENT_TIMESTAMP`, [recipientId, recipientType, name || null]);
};
exports.saveLineGroupId = saveLineGroupId;
// Remove LINE recipient
const removeLineRecipient = async (recipientId) => {
    await (0, connection_1.query)('UPDATE line_recipients SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE recipient_id = $1', [recipientId]);
};
exports.removeLineRecipient = removeLineRecipient;
// Send message to all LINE recipients
const sendLineMessage = async (message) => {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || null;
    if (!channelAccessToken) {
        console.log('LINE Channel Access Token not configured');
        return false;
    }
    const recipients = await (0, exports.getLineRecipients)();
    if (recipients.length === 0) {
        console.log('No LINE recipients configured');
        return false;
    }
    let successCount = 0;
    let failCount = 0;
    for (const recipient of recipients) {
        try {
            const response = await fetch(LINE_MESSAGING_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + channelAccessToken,
                },
                body: JSON.stringify({
                    to: recipient.recipient_id,
                    messages: [
                        {
                            type: 'text',
                            text: message,
                        },
                    ],
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('LINE API error for ' + recipient.recipient_id + ':', response.status, errorText);
                failCount++;
            }
            else {
                console.log('LINE message sent to ' + recipient.recipient_type + ': ' + recipient.recipient_id.slice(-8));
                successCount++;
            }
        }
        catch (error) {
            console.error('Failed to send LINE message to ' + recipient.recipient_id + ':', error);
            failCount++;
        }
    }
    console.log('LINE messages sent: ' + successCount + ' success, ' + failCount + ' failed');
    return successCount > 0;
};
exports.sendLineMessage = sendLineMessage;
// Format notification message for LINE
const formatNotificationMessage = (overdueLubrication, urgentLubrication, scheduledLubrication, overdueReplacement, urgentReplacement, scheduledReplacement, lowStockParts) => {
    const lines = [];
    if (overdueLubrication.length > 0) {
        lines.push('‼️ 【期限切れ給油】');
        overdueLubrication.forEach((item) => {
            lines.push('  ・' + item.machine_name + ' - ' + item.point_name);
            lines.push('    期限: ' + formatDate(item.next_date) + '（超過）');
        });
        lines.push('');
    }
    if (urgentLubrication.length > 0) {
        lines.push('\u{1F6A8} 【緊急給油】');
        urgentLubrication.forEach((item) => {
            lines.push('  ・' + item.machine_name + ' - ' + item.point_name);
            lines.push('    期限: ' + formatDate(item.next_date));
        });
        lines.push('');
    }
    if (scheduledLubrication.length > 0) {
        lines.push('\u{1F4C5} 【給油予定】');
        scheduledLubrication.forEach((item) => {
            lines.push('  ・' + item.machine_name + ' - ' + item.point_name);
            lines.push('    予定日: ' + formatDate(item.next_date));
        });
        lines.push('');
    }
    if (overdueReplacement.length > 0) {
        lines.push('‼️ 【期限切れ部品交換】');
        overdueReplacement.forEach((item) => {
            lines.push('  ・' + item.machine_name + ' - ' + item.part_name);
            lines.push('    期限: ' + formatDate(item.next_replacement_date) + '（超過）');
        });
        lines.push('');
    }
    if (urgentReplacement.length > 0) {
        lines.push('\u{1F6A8} 【緊急部品交換】');
        urgentReplacement.forEach((item) => {
            lines.push('  ・' + item.machine_name + ' - ' + item.part_name);
            lines.push('    期限: ' + formatDate(item.next_replacement_date));
        });
        lines.push('');
    }
    if (scheduledReplacement.length > 0) {
        lines.push('\u{1F4C5} 【部品交換予定】');
        scheduledReplacement.forEach((item) => {
            lines.push('  ・' + item.machine_name + ' - ' + item.part_name);
            lines.push('    予定日: ' + formatDate(item.next_replacement_date));
        });
        lines.push('');
    }
    if (lowStockParts.length > 0) {
        lines.push('\u{26A0}\u{FE0F} 【発注依頼】');
        lowStockParts.forEach((item) => {
            lines.push('  ・' + item.part_name);
            lines.push('    発注依頼: ' + item.quantity + ' / 現在庫: ' + item.minimum_quantity);
        });
        lines.push('');
    }
    if (lines.length === 0) {
        return null;
    }
    const appUrl = process.env.FRONTEND_URL || 'https://settukomaki-frontend.vercel.app';
    return '━━━━━━━━━━━━━━━━\n\u{1F4CB} 設備保全通知\n━━━━━━━━━━━━━━━━\n\n' + lines.join('\n') + '\n━━━━━━━━━━━━━━━━\n\u{1F517} アプリを開く:\n' + appUrl;
};
exports.formatNotificationMessage = formatNotificationMessage;
const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return (date.getMonth() + 1) + '/' + date.getDate();
};
//# sourceMappingURL=lineService.js.map