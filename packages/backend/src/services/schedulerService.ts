import cron, { ScheduledTask } from 'node-cron';
import { query } from '../database/connection';
import { logger } from '../utils/logger';

// Store scheduled tasks so we can stop and restart them
let scheduledTasks: ScheduledTask[] = [];

// Helper function to convert time string (HH:MM) to cron expression
function timeToCron(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  return `${minutes} ${hours} * * *`;
}

// Get settings from database
async function getScheduleSettings() {
  try {
    const result = await query(`
      SELECT key, value FROM settings
      WHERE key IN ('notification_lubrication_time', 'notification_replacement_time', 'notification_stock_time')
    `);

    const settings: Record<string, string> = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    return {
      lubricationTime: settings['notification_lubrication_time'] || '8:00',
      replacementTime: settings['notification_replacement_time'] || '8:15',
      stockTime: settings['notification_stock_time'] || '9:00',
    };
  } catch (error) {
    logger.error('Error loading schedule settings:', error);
    // Return defaults if error
    return {
      lubricationTime: '8:00',
      replacementTime: '8:15',
      stockTime: '9:00',
    };
  }
}

export async function initScheduler() {
  const settings = await getScheduleSettings();

  // Check lubrication due dates
  const lubricationTask = cron.schedule(timeToCron(settings.lubricationTime), async () => {
    logger.info('Running lubrication due date check...');
    await checkLubricationDueDates();
  });
  scheduledTasks.push(lubricationTask);

  // Check replacement due dates
  const replacementTask = cron.schedule(timeToCron(settings.replacementTime), async () => {
    logger.info('Running replacement due date check...');
    await checkReplacementDueDates();
  });
  scheduledTasks.push(replacementTask);

  // Check low stock
  const stockTask = cron.schedule(timeToCron(settings.stockTime), async () => {
    logger.info('Running low stock check...');
    await checkLowStock();
  });
  scheduledTasks.push(stockTask);

  // Send pending push notifications every 5 minutes
  const notificationTask = cron.schedule('*/5 * * * *', async () => {
    logger.info('Sending pending push notifications...');
    await sendPendingNotifications();
  });
  scheduledTasks.push(notificationTask);

  logger.info(`Scheduler initialized - Lubrication: ${settings.lubricationTime}, Replacement: ${settings.replacementTime}, Stock: ${settings.stockTime}`);
}

export function restartScheduler() {
  logger.info('Restarting scheduler with new settings...');

  // Stop all existing tasks
  scheduledTasks.forEach(task => task.stop());
  scheduledTasks = [];

  // Reinitialize with new settings
  initScheduler();
}

async function checkLubricationDueDates() {
  try {
    // Find lubrication points that are due or overdue
    const result = await query(`
      SELECT
        lp.id,
        lp.machine_name,
        lp.location,
        lr.next_due_date
      FROM lubrication_points lp
      LEFT JOIN LATERAL (
        SELECT next_due_date
        FROM lubrication_records
        WHERE point_id = lp.id
        ORDER BY performed_at DESC
        LIMIT 1
      ) lr ON true
      WHERE lp.is_active = true
        AND (lr.next_due_date IS NULL OR lr.next_due_date <= CURRENT_DATE + INTERVAL '7 days')
    `);

    for (const point of result.rows) {
      const daysUntil = point.next_due_date
        ? Math.ceil((new Date(point.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : -999;

      let type: 'lubrication_due' | 'lubrication_overdue' = 'lubrication_due';
      let title = '';
      let message = '';

      if (daysUntil < 0 || point.next_due_date === null) {
        type = 'lubrication_overdue';
        title = `給油超過: ${point.machine_name} - ${point.location}`;
        message = `給油が期限を過ぎています。早急に対応してください。`;
      } else if (daysUntil <= 3) {
        type = 'lubrication_due';
        title = `給油予定: ${point.machine_name} - ${point.location}`;
        message = `${daysUntil}日後に給油が必要です。`;
      } else if (daysUntil <= 7) {
        type = 'lubrication_due';
        title = `給油予定: ${point.machine_name} - ${point.location}`;
        message = `${daysUntil}日後に給油が必要です。`;
      }

      if (title) {
        // Check if notification already exists for today
        const existingNotif = await query(
          `SELECT id FROM notifications
           WHERE type = $1 AND entity_type = 'lubrication_point' AND entity_id = $2
           AND DATE(created_at) = CURRENT_DATE`,
          [type, point.id]
        );

        if (existingNotif.rows.length === 0) {
          await query(
            `INSERT INTO notifications (type, title, message, entity_type, entity_id)
             VALUES ($1, $2, $3, 'lubrication_point', $4)`,
            [type, title, message, point.id]
          );
          logger.info(`Created notification for lubrication point ${point.id}`);
        }
      }
    }
  } catch (error) {
    logger.error('Error checking lubrication due dates:', error);
  }
}

async function checkLowStock() {
  try {
    const result = await query(`
      SELECT id, part_name, current_stock, min_stock, unit
      FROM parts
      WHERE is_active = true AND current_stock < min_stock
    `);

    for (const part of result.rows) {
      const title = `在庫不足: ${part.part_name}`;
      const message = `現在庫: ${part.current_stock}${part.unit}、発注点: ${part.min_stock}${part.unit}。発注を検討してください。`;

      // Check if notification already exists for today
      const existingNotif = await query(
        `SELECT id FROM notifications
         WHERE type = 'low_stock' AND entity_type = 'part' AND entity_id = $1
         AND DATE(created_at) = CURRENT_DATE`,
        [part.id]
      );

      if (existingNotif.rows.length === 0) {
        await query(
          `INSERT INTO notifications (type, title, message, entity_type, entity_id)
           VALUES ('low_stock', $1, $2, 'part', $3)`,
          [title, message, part.id]
        );
        logger.info(`Created notification for low stock part ${part.id}`);
      }
    }
  } catch (error) {
    logger.error('Error checking low stock:', error);
  }
}

async function checkReplacementDueDates() {
  try {
    // Find replacement schedules that are due or overdue
    const result = await query(`
      SELECT
        rs.id,
        rs.machine_name,
        rs.part_name,
        rr.next_due_date
      FROM replacement_schedules rs
      LEFT JOIN LATERAL (
        SELECT next_due_date
        FROM replacement_records
        WHERE schedule_id = rs.id
        ORDER BY replaced_at DESC
        LIMIT 1
      ) rr ON true
      WHERE rs.is_active = true
        AND (rr.next_due_date IS NULL OR rr.next_due_date <= CURRENT_DATE + INTERVAL '14 days')
    `);

    for (const schedule of result.rows) {
      const daysUntil = schedule.next_due_date
        ? Math.ceil((new Date(schedule.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : -999;

      let type: 'replacement_due' | 'replacement_overdue' = 'replacement_due';
      let title = '';
      let message = '';

      if (daysUntil < 0 || schedule.next_due_date === null) {
        type = 'replacement_overdue';
        title = `部品交換超過: ${schedule.machine_name} - ${schedule.part_name}`;
        message = `部品交換が期限を過ぎています。早急に対応してください。`;
      } else if (daysUntil <= 7) {
        type = 'replacement_due';
        title = `部品交換予定: ${schedule.machine_name} - ${schedule.part_name}`;
        message = `${daysUntil}日後に部品交換が必要です。`;
      } else if (daysUntil <= 14) {
        type = 'replacement_due';
        title = `部品交換予定: ${schedule.machine_name} - ${schedule.part_name}`;
        message = `${daysUntil}日後に部品交換が必要です。`;
      }

      if (title) {
        // Check if notification already exists for today
        const existingNotif = await query(
          `SELECT id FROM notifications
           WHERE type = $1 AND entity_type = 'replacement_schedule' AND entity_id = $2
           AND DATE(created_at) = CURRENT_DATE`,
          [type, schedule.id]
        );

        if (existingNotif.rows.length === 0) {
          await query(
            `INSERT INTO notifications (type, title, message, entity_type, entity_id)
             VALUES ($1, $2, $3, 'replacement_schedule', $4)`,
            [type, title, message, schedule.id]
          );
          logger.info(`Created notification for replacement schedule ${schedule.id}`);
        }
      }
    }
  } catch (error) {
    logger.error('Error checking replacement due dates:', error);
  }
}

async function sendPendingNotifications() {
  try {
    // This would integrate with the push notification service
    // For now, just mark as sent
    await query(
      `UPDATE notifications
       SET is_sent = true, sent_at = CURRENT_TIMESTAMP
       WHERE is_sent = false AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 minute'`
    );
  } catch (error) {
    logger.error('Error sending pending notifications:', error);
  }
}
