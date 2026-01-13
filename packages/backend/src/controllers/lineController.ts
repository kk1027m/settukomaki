import { Request, Response } from 'express';
import { query } from '../database/connection';
import {
  saveLineGroupId,
  sendLineMessage,
  formatNotificationMessage,
  getLineSettings,
  getLineRecipients,
  removeLineRecipient,
} from '../services/lineService';

// LINE Webhook handler - receives events from LINE
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const events = req.body.events || [];

    for (const event of events) {
      console.log('LINE event received:', event.type, event.source);

      // When bot joins a group, save the group ID
      if (event.type === 'join' && event.source.type === 'group') {
        const groupId = event.source.groupId;
        console.log('Bot joined group:', groupId);
        await saveLineGroupId(groupId, 'group');
      }

      // When bot leaves a group, deactivate the recipient
      if (event.type === 'leave' && event.source.type === 'group') {
        const groupId = event.source.groupId;
        console.log('Bot left group:', groupId);
        await removeLineRecipient(groupId);
      }

      // Capture group ID from any message in a group (always save/update)
      if (event.source.type === 'group' && event.source.groupId) {
        const groupId = event.source.groupId;
        console.log('Saving/updating group ID from message event:', groupId);
        await saveLineGroupId(groupId, 'group');
      }

      // Capture user ID from 1:1 chat (always save/update)
      if (event.source.type === 'user' && event.source.userId) {
        const userId = event.source.userId;
        console.log('Saving/updating user ID from 1:1 chat:', userId);
        await saveLineGroupId(userId, 'user');
      }
    }

    // LINE expects 200 OK response
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ success: true }); // Still return 200 to LINE
  }
};

// Cron job endpoint - called by Vercel Cron
export const runNotificationCron = async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Cron error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Manual trigger for testing
export const triggerNotification = async (req: Request, res: Response) => {
  try {
    const result = await checkAndSendNotifications();
    res.json(result);
  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check all conditions and send LINE notification
const checkAndSendNotifications = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Overdue lubrication (past due date)
  const overdueLubricationResult = await query(
    `SELECT DISTINCT ON (lp.id)
       lp.id, lp.machine_name, lp.location as point_name, lr.next_due_date as next_date
     FROM lubrication_points lp
     JOIN lubrication_records lr ON lr.point_id = lp.id
     WHERE lp.is_active = true
       AND lr.next_due_date < $1
     ORDER BY lp.id, lr.performed_at DESC`,
    [today.toISOString().split('T')[0]]
  );

  // Urgent lubrication (within 3 days)
  const urgentLubricationResult = await query(
    `SELECT DISTINCT ON (lp.id)
       lp.id, lp.machine_name, lp.location as point_name, lr.next_due_date as next_date
     FROM lubrication_points lp
     JOIN lubrication_records lr ON lr.point_id = lp.id
     WHERE lp.is_active = true
       AND lr.next_due_date <= $1
       AND lr.next_due_date >= $2
     ORDER BY lp.id, lr.performed_at DESC`,
    [threeDaysFromNow.toISOString().split('T')[0], today.toISOString().split('T')[0]]
  );

  // Scheduled lubrication (4-7 days)
  const scheduledLubricationResult = await query(
    `SELECT DISTINCT ON (lp.id)
       lp.id, lp.machine_name, lp.location as point_name, lr.next_due_date as next_date
     FROM lubrication_points lp
     JOIN lubrication_records lr ON lr.point_id = lp.id
     WHERE lp.is_active = true
       AND lr.next_due_date > $1
       AND lr.next_due_date <= $2
     ORDER BY lp.id, lr.performed_at DESC`,
    [threeDaysFromNow.toISOString().split('T')[0], sevenDaysFromNow.toISOString().split('T')[0]]
  );

  // Overdue replacement (past due date)
  const overdueReplacementResult = await query(
    `SELECT DISTINCT ON (rs.id)
       rs.id, rs.machine_name, rs.part_name, rr.next_due_date as next_replacement_date
     FROM replacement_schedules rs
     JOIN replacement_records rr ON rr.schedule_id = rs.id
     WHERE rs.is_active = true
       AND rr.next_due_date < $1
     ORDER BY rs.id, rr.replaced_at DESC`,
    [today.toISOString().split('T')[0]]
  );

  // Urgent replacement (within 3 days)
  const urgentReplacementResult = await query(
    `SELECT DISTINCT ON (rs.id)
       rs.id, rs.machine_name, rs.part_name, rr.next_due_date as next_replacement_date
     FROM replacement_schedules rs
     JOIN replacement_records rr ON rr.schedule_id = rs.id
     WHERE rs.is_active = true
       AND rr.next_due_date <= $1
       AND rr.next_due_date >= $2
     ORDER BY rs.id, rr.replaced_at DESC`,
    [threeDaysFromNow.toISOString().split('T')[0], today.toISOString().split('T')[0]]
  );

  // Scheduled replacement (4-7 days)
  const scheduledReplacementResult = await query(
    `SELECT DISTINCT ON (rs.id)
       rs.id, rs.machine_name, rs.part_name, rr.next_due_date as next_replacement_date
     FROM replacement_schedules rs
     JOIN replacement_records rr ON rr.schedule_id = rs.id
     WHERE rs.is_active = true
       AND rr.next_due_date > $1
       AND rr.next_due_date <= $2
     ORDER BY rs.id, rr.replaced_at DESC`,
    [threeDaysFromNow.toISOString().split('T')[0], sevenDaysFromNow.toISOString().split('T')[0]]
  );

  // Low stock parts
  const lowStockResult = await query(
    `SELECT part_name, current_stock as quantity, min_stock as minimum_quantity
     FROM parts
     WHERE is_active = true AND current_stock < min_stock
     ORDER BY part_name ASC`
  );

  const message = formatNotificationMessage(
    overdueLubricationResult.rows,
    urgentLubricationResult.rows,
    scheduledLubricationResult.rows,
    overdueReplacementResult.rows,
    urgentReplacementResult.rows,
    scheduledReplacementResult.rows,
    lowStockResult.rows
  );

  if (!message) {
    console.log('No notifications to send');
    return { success: true, message: 'No notifications needed' };
  }

  const sent = await sendLineMessage(message);

  return {
    success: sent,
    message: sent ? 'Notification sent' : 'Failed to send notification',
    counts: {
      overdueLubrication: overdueLubricationResult.rows.length,
      urgentLubrication: urgentLubricationResult.rows.length,
      scheduledLubrication: scheduledLubricationResult.rows.length,
      overdueReplacement: overdueReplacementResult.rows.length,
      urgentReplacement: urgentReplacementResult.rows.length,
      scheduledReplacement: scheduledReplacementResult.rows.length,
      lowStock: lowStockResult.rows.length,
    },
  };
};

// Get current LINE settings status
export const getLineStatus = async (req: Request, res: Response) => {
  try {
    const settings = await getLineSettings();
    const recipients = await getLineRecipients();
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
  } catch (error) {
    console.error('Get LINE status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Test LINE connection
export const testLineConnection = async (req: Request, res: Response) => {
  try {
    const sent = await sendLineMessage('🔔 テスト通知\n\nLINE通知の接続テストです。このメッセージが届いていれば、設定は正常です。');
    res.json({
      success: sent,
      message: sent ? 'Test message sent' : 'Failed to send test message',
    });
  } catch (error) {
    console.error('Test LINE connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete LINE recipient
export const deleteLineRecipient = async (req: Request, res: Response) => {
  try {
    const { recipientId } = req.params;
    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }
    await removeLineRecipient(recipientId);
    res.json({ success: true, message: 'Recipient removed' });
  } catch (error) {
    console.error('Delete LINE recipient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
