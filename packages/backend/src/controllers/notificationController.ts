import { Response } from 'express';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { unread_only } = req.query;

    let sql = `
      SELECT * FROM notifications
      WHERE user_id = $1 OR user_id IS NULL
    `;

    if (unread_only === 'true') {
      sql += ' AND is_read = false';
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';

    const result = await query(sql, [req.user?.id]);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false`,
      [req.user?.id]
    );

    res.json({
      success: true,
      data: { count: parseInt(result.rows[0].count) },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) RETURNING *',
      [id, req.user?.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response, next: any) => {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false',
      [req.user?.id]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND (user_id = $2 OR user_id IS NULL) RETURNING id',
      [id, req.user?.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const subscribePush = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { endpoint, p256dh, auth } = req.body;
    const user_agent = req.headers['user-agent'] || null;

    const result = await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, endpoint) DO UPDATE
       SET p256dh = $3, auth = $4, is_active = true, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user?.id, endpoint, p256dh, auth, user_agent]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Push notification subscription successful',
    });
  } catch (error) {
    next(error);
  }
};

export const unsubscribePush = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { endpoint } = req.body;

    await query(
      'UPDATE push_subscriptions SET is_active = false WHERE user_id = $1 AND endpoint = $2',
      [req.user?.id, endpoint]
    );

    res.json({
      success: true,
      message: 'Push notification unsubscription successful',
    });
  } catch (error) {
    next(error);
  }
};
