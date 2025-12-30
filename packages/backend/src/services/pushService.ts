import webpush from 'web-push';
import { query } from '../database/connection';
import { logger } from '../utils/logger';

// Initialize web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@sets-carton.co.jp',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
}

export async function sendPushToUser(userId: number, payload: PushPayload) {
  try {
    // Get active subscriptions for user
    const result = await query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const promises = result.rows.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(payload)
        );
        logger.info(`Push notification sent to user ${userId}`);
      } catch (error: any) {
        logger.error(`Failed to send push to subscription ${subscription.id}:`, error);

        // If subscription is invalid, deactivate it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await query(
            'UPDATE push_subscriptions SET is_active = false WHERE id = $1',
            [subscription.id]
          );
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    logger.error(`Error sending push to user ${userId}:`, error);
  }
}

export async function sendPushToAll(payload: PushPayload) {
  try {
    const result = await query(
      'SELECT DISTINCT user_id FROM push_subscriptions WHERE is_active = true'
    );

    const promises = result.rows.map((row) => sendPushToUser(row.user_id, payload));

    await Promise.all(promises);
  } catch (error) {
    logger.error('Error sending push to all users:', error);
  }
}

export async function sendPushToAdmins(payload: PushPayload) {
  try {
    const result = await query(
      `SELECT DISTINCT ps.user_id
       FROM push_subscriptions ps
       JOIN users u ON ps.user_id = u.id
       WHERE ps.is_active = true AND u.role = 'admin'`
    );

    const promises = result.rows.map((row) => sendPushToUser(row.user_id, payload));

    await Promise.all(promises);
  } catch (error) {
    logger.error('Error sending push to admins:', error);
  }
}
