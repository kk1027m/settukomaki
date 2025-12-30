import { Response } from 'express';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { restartScheduler } from '../services/schedulerService';

export const getSettings = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query('SELECT * FROM settings ORDER BY key');

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getSetting = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { key } = req.params;

    const result = await query('SELECT * FROM settings WHERE key = $1', [key]);

    if (result.rows.length === 0) {
      throw new AppError('Setting not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateSetting = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    // Validate time format for notification settings
    if (key.startsWith('notification_') && key.endsWith('_time')) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(value)) {
        throw new AppError('Invalid time format. Use HH:MM format (e.g., 08:00)', 400);
      }
    }

    const result = await query(
      `UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP
       WHERE key = $2
       RETURNING *`,
      [value, key]
    );

    if (result.rows.length === 0) {
      throw new AppError('Setting not found', 404);
    }

    // Restart scheduler if notification time was changed
    if (key.startsWith('notification_') && key.endsWith('_time')) {
      restartScheduler();
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateMultipleSettings = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      throw new AppError('Settings must be an array', 400);
    }

    const results = [];
    let shouldRestartScheduler = false;

    for (const setting of settings) {
      const { key, value } = setting;

      // Validate time format for notification settings
      if (key.startsWith('notification_') && key.endsWith('_time')) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(value)) {
          throw new AppError(`Invalid time format for ${key}. Use HH:MM format (e.g., 08:00)`, 400);
        }
        shouldRestartScheduler = true;
      }

      const result = await query(
        `UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP
         WHERE key = $2
         RETURNING *`,
        [value, key]
      );

      if (result.rows.length > 0) {
        results.push(result.rows[0]);
      }
    }

    // Restart scheduler if any notification time was changed
    if (shouldRestartScheduler) {
      restartScheduler();
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
