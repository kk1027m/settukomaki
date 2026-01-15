import { Response } from 'express';
import { query } from '../database/connection';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

// トラブルシューティング一覧取得
export const getTroubleshootingItems = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(
      `SELECT * FROM troubleshooting_items
       WHERE is_active = true
       ORDER BY sort_order ASC, machine_name ASC, unit_name ASC NULLS LAST, trouble_title ASC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// トラブルシューティング詳細取得
export const getTroubleshootingItemById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT t.*, u.full_name as created_by_name
       FROM troubleshooting_items t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('トラブルシューティングが見つかりません', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// トラブルシューティング作成
export const createTroubleshootingItem = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { machine_name, unit_name, trouble_title, trouble_description, solution } = req.body;
    const userId = req.user?.id;

    if (!machine_name || !trouble_title) {
      throw new AppError('機械名とトラブル内容は必須です', 400);
    }

    const result = await query(
      `INSERT INTO troubleshooting_items (machine_name, unit_name, trouble_title, trouble_description, solution, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [machine_name, unit_name || null, trouble_title, trouble_description || null, solution || null, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// トラブルシューティング更新
export const updateTroubleshootingItem = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { machine_name, unit_name, trouble_title, trouble_description, solution } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (machine_name !== undefined) {
      updates.push(`machine_name = $${paramCount++}`);
      values.push(machine_name);
    }

    if (unit_name !== undefined) {
      updates.push(`unit_name = $${paramCount++}`);
      values.push(unit_name || null);
    }

    if (trouble_title !== undefined) {
      updates.push(`trouble_title = $${paramCount++}`);
      values.push(trouble_title);
    }

    if (trouble_description !== undefined) {
      updates.push(`trouble_description = $${paramCount++}`);
      values.push(trouble_description || null);
    }

    if (solution !== undefined) {
      updates.push(`solution = $${paramCount++}`);
      values.push(solution || null);
    }

    if (updates.length === 0) {
      throw new AppError('更新するフィールドがありません', 400);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE troubleshooting_items SET ${updates.join(', ')} WHERE id = $${paramCount} AND is_active = true RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('トラブルシューティングが見つかりません', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// トラブルシューティング削除
export const deleteTroubleshootingItem = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE troubleshooting_items SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('トラブルシューティングが見つかりません', 404);
    }

    res.json({
      success: true,
      message: 'トラブルシューティングを削除しました',
    });
  } catch (error) {
    next(error);
  }
};

// 並び順更新
export const updateTroubleshootingSortOrder = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      throw new AppError('items配列が必要です', 400);
    }

    for (const item of items) {
      await query(
        `UPDATE troubleshooting_items SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [item.sort_order, item.id]
      );
    }

    res.json({
      success: true,
      message: '並び順を更新しました',
    });
  } catch (error) {
    next(error);
  }
};

// 機械名一覧取得
export const getMachineNames = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(
      `SELECT DISTINCT machine_name FROM troubleshooting_items WHERE is_active = true ORDER BY machine_name ASC`
    );

    res.json({
      success: true,
      data: result.rows.map(row => row.machine_name),
    });
  } catch (error) {
    next(error);
  }
};

// ユニット名一覧取得
export const getUnitNames = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(
      `SELECT DISTINCT unit_name FROM troubleshooting_items WHERE is_active = true AND unit_name IS NOT NULL ORDER BY unit_name ASC`
    );

    res.json({
      success: true,
      data: result.rows.map(row => row.unit_name),
    });
  } catch (error) {
    next(error);
  }
};
