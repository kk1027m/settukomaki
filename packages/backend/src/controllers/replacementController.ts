import { Response } from 'express';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { addDays } from '../utils/dateHelper';
import { createNotificationTopic } from './topicsController';

export const getReplacementSchedules = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(`
      SELECT
        rs.*,
        rr.replaced_at as last_replaced,
        rr.next_due_date,
        CASE
          WHEN rr.next_due_date IS NULL THEN 0
          ELSE (rr.next_due_date - CURRENT_DATE)
        END as days_until_due
      FROM replacement_schedules rs
      LEFT JOIN LATERAL (
        SELECT replaced_at, next_due_date
        FROM replacement_records
        WHERE schedule_id = rs.id
        ORDER BY replaced_at DESC
        LIMIT 1
      ) rr ON true
      WHERE rs.is_active = true
      ORDER BY rs.unit_name NULLS LAST, days_until_due ASC NULLS FIRST, rs.machine_name
    `);

    const schedulesWithStatus = result.rows.map(schedule => {
      let status = 'ok';
      const daysUntilDue = schedule.days_until_due;

      if (daysUntilDue === null || daysUntilDue === undefined) {
        status = 'overdue';
      } else if (daysUntilDue < 0) {
        status = 'overdue';
      } else if (daysUntilDue <= 7) {
        status = 'due_soon';
      } else if (daysUntilDue <= 14) {
        status = 'upcoming';
      }

      return {
        ...schedule,
        status,
      };
    });

    res.json({
      success: true,
      data: schedulesWithStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const getReplacementScheduleById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM replacement_schedules WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Replacement schedule not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createReplacementSchedule = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { machine_name, unit_name, part_name, part_number, cycle_days, description } = req.body;

    const result = await query(
      `INSERT INTO replacement_schedules (machine_name, unit_name, part_name, part_number, cycle_days, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [machine_name, unit_name || null, part_name, part_number || null, cycle_days, description || null, req.user?.id]
    );

    // Create notification topic
    const scheduleData = result.rows[0];
    await createNotificationTopic(
      '交換予定が追加されました',
      `${machine_name}${unit_name ? ' - ' + unit_name : ''} - ${part_name} の交換予定が追加されました。`,
      req.user?.id || 1
    );

    res.status(201).json({
      success: true,
      data: scheduleData,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      next(new AppError('Replacement schedule already exists for this machine and part', 409));
    } else {
      next(error);
    }
  }
};

export const updateReplacementSchedule = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { machine_name, unit_name, part_name, part_number, cycle_days, description, is_active } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (machine_name !== undefined) {
      updates.push(`machine_name = $${paramCount++}`);
      values.push(machine_name);
    }

    if (unit_name !== undefined) {
      updates.push(`unit_name = $${paramCount++}`);
      values.push(unit_name);
    }

    if (part_name !== undefined) {
      updates.push(`part_name = $${paramCount++}`);
      values.push(part_name);
    }

    if (part_number !== undefined) {
      updates.push(`part_number = $${paramCount++}`);
      values.push(part_number);
    }

    if (cycle_days !== undefined) {
      updates.push(`cycle_days = $${paramCount++}`);
      values.push(cycle_days);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE replacement_schedules SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Replacement schedule not found', 404);
    }

    // Create notification topic for edit
    const updatedSchedule = result.rows[0];
    await createNotificationTopic(
      '交換予定が編集されました',
      `${updatedSchedule.machine_name}${updatedSchedule.unit_name ? ' - ' + updatedSchedule.unit_name : ''} - ${updatedSchedule.part_name} の交換予定が編集されました。`,
      req.user?.id || 1
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReplacementSchedule = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM replacement_schedules WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Replacement schedule not found', 404);
    }

    res.json({
      success: true,
      message: 'Replacement schedule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const performReplacement = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { replaced_at, notes } = req.body;

    // Get replacement schedule
    const scheduleResult = await query(
      'SELECT * FROM replacement_schedules WHERE id = $1',
      [id]
    );

    if (scheduleResult.rows.length === 0) {
      throw new AppError('Replacement schedule not found', 404);
    }

    const schedule = scheduleResult.rows[0];

    // Calculate next due date
    const replacedDate = replaced_at ? new Date(replaced_at) : new Date();
    const nextDueDate = addDays(replacedDate, schedule.cycle_days);

    // Insert replacement record
    const result = await query(
      `INSERT INTO replacement_records (schedule_id, replaced_at, replaced_by, next_due_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, replacedDate, req.user?.id, nextDueDate, notes || null]
    );

    // Create notification topic
    await createNotificationTopic(
      '部品交換が完了しました',
      `${schedule.machine_name}${schedule.unit_name ? ' - ' + schedule.unit_name : ''} - ${schedule.part_name} の交換が完了しました。`,
      req.user?.id || 1
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const getReplacementRecords = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT rr.*, u.username as replaced_by_username
       FROM replacement_records rr
       LEFT JOIN users u ON rr.replaced_by = u.id
       WHERE rr.schedule_id = $1
       ORDER BY rr.replaced_at DESC
       LIMIT 50`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(`
      SELECT
        rs.id,
        rs.machine_name,
        rs.unit_name,
        rs.part_name,
        rs.part_number,
        rs.cycle_days,
        rr.replaced_at as last_replaced,
        rr.next_due_date as due_date,
        CASE
          WHEN rr.next_due_date IS NULL THEN -999
          ELSE (rr.next_due_date - CURRENT_DATE)
        END as days_until_due,
        CASE
          WHEN rr.next_due_date IS NULL THEN 'overdue'
          WHEN rr.next_due_date < CURRENT_DATE THEN 'overdue'
          WHEN rr.next_due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
          WHEN rr.next_due_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'upcoming'
          ELSE 'ok'
        END as status
      FROM replacement_schedules rs
      LEFT JOIN LATERAL (
        SELECT replaced_at, next_due_date
        FROM replacement_records
        WHERE schedule_id = rs.id
        ORDER BY replaced_at DESC
        LIMIT 1
      ) rr ON true
      WHERE rs.is_active = true
        AND (rr.next_due_date IS NULL OR rr.next_due_date <= CURRENT_DATE + INTERVAL '14 days')
      ORDER BY rs.unit_name NULLS LAST, days_until_due ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};
