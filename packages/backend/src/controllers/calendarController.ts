import { Response } from 'express';
import { query } from '../database/connection';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// カレンダーイベント一覧取得
export const getEvents = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { year, month } = req.query;

    let sql = `
      SELECT e.*, u.full_name as created_by_name
      FROM calendar_events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const values: any[] = [];

    if (year && month) {
      // 該当月に開始または終了する、または該当月をまたぐイベントを取得
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      const endOfMonth = new Date(Number(year), Number(month), 0).getDate();
      const endOfMonthDate = `${year}-${String(month).padStart(2, '0')}-${endOfMonth}`;

      sql += ` AND (
        (e.date >= $1 AND e.date <= $2) OR
        (e.end_date >= $1 AND e.end_date <= $2) OR
        (e.date <= $1 AND e.end_date >= $2)
      )`;
      values.push(startOfMonth, endOfMonthDate);
    }

    sql += ` ORDER BY e.date ASC, e.start_time ASC NULLS LAST, e.created_at ASC`;

    const result = await query(sql, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// 日付背景色一覧取得
export const getDayColors = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { year, month } = req.query;

    let sql = `SELECT * FROM calendar_day_colors WHERE 1=1`;
    const values: any[] = [];

    if (year && month) {
      sql += ` AND EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2`;
      values.push(year, month);
    }

    const result = await query(sql, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// イベント作成
export const createEvent = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { date, end_date, title, description, color, start_time } = req.body;
    const userId = req.user?.id;

    if (!date || !title) {
      throw new AppError('日付とタイトルは必須です', 400);
    }

    // end_dateがdateより前の場合はエラー
    if (end_date && new Date(end_date) < new Date(date)) {
      throw new AppError('終了日は開始日より後に設定してください', 400);
    }

    const result = await query(
      `INSERT INTO calendar_events (date, end_date, title, description, color, start_time, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [date, end_date || null, title, description || null, color || 'blue', start_time || null, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// イベント更新
export const updateEvent = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { date, end_date, title, description, color, start_time } = req.body;

    // end_dateがdateより前の場合はエラー
    if (date && end_date && new Date(end_date) < new Date(date)) {
      throw new AppError('終了日は開始日より後に設定してください', 400);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (date !== undefined) {
      updates.push(`date = $${paramCount++}`);
      values.push(date);
    }

    if (end_date !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(end_date || null);
    }

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }

    if (start_time !== undefined) {
      updates.push(`start_time = $${paramCount++}`);
      values.push(start_time || null);
    }

    if (updates.length === 0) {
      throw new AppError('更新するフィールドがありません', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('イベントが見つかりません', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// イベント削除
export const deleteEvent = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM calendar_events WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new AppError('イベントが見つかりません', 404);
    }

    res.json({
      success: true,
      message: 'イベントを削除しました',
    });
  } catch (error) {
    next(error);
  }
};

// 日付背景色の設定
export const setDayColor = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { date, color } = req.body;
    const userId = req.user?.id;

    if (!date) {
      throw new AppError('日付は必須です', 400);
    }

    // 色が空またはnullの場合は削除
    if (!color) {
      await query('DELETE FROM calendar_day_colors WHERE date = $1', [date]);
      return res.json({
        success: true,
        message: '日付の色を削除しました',
      });
    }

    const result = await query(
      `INSERT INTO calendar_day_colors (date, color, created_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (date) DO UPDATE SET
         color = $2,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [date, color, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// 週シフト一覧取得
export const getWeekShifts = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { year, month } = req.query;

    let sql = `SELECT sunday_date, shift FROM calendar_week_shifts WHERE 1=1`;
    const values: any[] = [];

    if (year && month) {
      sql += ` AND EXTRACT(YEAR FROM sunday_date) = $1 AND EXTRACT(MONTH FROM sunday_date) = $2`;
      values.push(year, month);
    }

    sql += ` ORDER BY sunday_date ASC`;

    const result = await query(sql, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// 週シフト更新
export const updateWeekShift = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { sundayDate, shift } = req.body;
    const userId = req.user?.id;

    if (!sundayDate || !shift) {
      throw new AppError('日曜日の日付とシフトは必須です', 400);
    }

    if (shift !== 'A' && shift !== 'B') {
      throw new AppError('シフトはAまたはBを指定してください', 400);
    }

    const result = await query(
      `INSERT INTO calendar_week_shifts (sunday_date, shift, created_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (sunday_date) DO UPDATE SET
         shift = $2,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [sundayDate, shift, userId]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// 有給休暇一覧取得
export const getLeaves = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { year, month, date } = req.query;

    let sql = `SELECT * FROM calendar_leaves WHERE 1=1`;
    const values: any[] = [];
    let paramCount = 1;

    if (date) {
      sql += ` AND date = $${paramCount++}`;
      values.push(date);
    } else if (year && month) {
      sql += ` AND EXTRACT(YEAR FROM date) = $${paramCount++} AND EXTRACT(MONTH FROM date) = $${paramCount++}`;
      values.push(year, month);
    }

    sql += ` ORDER BY date ASC, employee_name ASC`;

    const result = await query(sql, values);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// 有給休暇追加
export const createLeave = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { date, employee_name, note } = req.body;
    const userId = req.user?.id;

    if (!date || !employee_name) {
      throw new AppError('日付と名前は必須です', 400);
    }

    const result = await query(
      `INSERT INTO calendar_leaves (date, employee_name, note, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [date, employee_name, note || null, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// 有給休暇削除
export const deleteLeave = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM calendar_leaves WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new AppError('有給休暇情報が見つかりません', 404);
    }

    res.json({
      success: true,
      message: '有給休暇情報を削除しました',
    });
  } catch (error) {
    next(error);
  }
};
