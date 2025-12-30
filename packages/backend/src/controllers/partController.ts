import { Response } from 'express';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { createNotificationTopic } from './topicsController';

export const getParts = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(`
      SELECT
        p.*,
        CASE
          WHEN p.current_stock = 0 THEN 'out'
          WHEN p.current_stock < p.min_stock THEN 'low'
          ELSE 'sufficient'
        END as stock_status,
        CASE
          WHEN p.current_stock < p.min_stock THEN true
          ELSE false
        END as needs_order
      FROM parts p
      WHERE p.is_active = true
      ORDER BY
        p.unit_name NULLS LAST,
        CASE
          WHEN p.current_stock < p.min_stock THEN 0
          ELSE 1
        END,
        p.part_name
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getPartById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM parts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Part not found', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const createPart = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { part_number, part_name, current_stock, min_stock, unit, unit_name, location, shelf_box_name, description } = req.body;

    const result = await query(
      `INSERT INTO parts (part_number, part_name, current_stock, min_stock, unit, unit_name, location, shelf_box_name, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [part_number || null, part_name, current_stock, min_stock, unit, unit_name || null, location || null, shelf_box_name || null, description || null, req.user?.id]
    );

    // Create notification topic
    const partData = result.rows[0];
    await createNotificationTopic(
      '部品が追加されました',
      `${part_name}${part_number ? ' (' + part_number + ')' : ''} が在庫に追加されました。`,
      req.user?.id || 1
    );

    res.status(201).json({
      success: true,
      data: partData,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      next(new AppError('Part number already exists', 409));
    } else {
      next(error);
    }
  }
};

export const updatePart = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { part_number, part_name, min_stock, unit, unit_name, location, shelf_box_name, description, is_active } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (part_number !== undefined) {
      updates.push(`part_number = $${paramCount++}`);
      values.push(part_number);
    }

    if (part_name !== undefined) {
      updates.push(`part_name = $${paramCount++}`);
      values.push(part_name);
    }

    if (min_stock !== undefined) {
      updates.push(`min_stock = $${paramCount++}`);
      values.push(min_stock);
    }

    if (unit !== undefined) {
      updates.push(`unit = $${paramCount++}`);
      values.push(unit);
    }

    if (unit_name !== undefined) {
      updates.push(`unit_name = $${paramCount++}`);
      values.push(unit_name);
    }

    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      values.push(location);
    }

    if (shelf_box_name !== undefined) {
      updates.push(`shelf_box_name = $${paramCount++}`);
      values.push(shelf_box_name);
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
      `UPDATE parts SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new AppError('Part not found', 404);
    }

    // Create notification topic for edit
    const updatedPart = result.rows[0];
    await createNotificationTopic(
      '部品情報が編集されました',
      `部品番号: ${updatedPart.part_number} - ${updatedPart.part_name} の情報が編集されました。`,
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

export const deletePart = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM parts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Part not found', 404);
    }

    res.json({
      success: true,
      message: 'Part deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { action_type, quantity, notes } = req.body;

    // Get current part
    const partResult = await query('SELECT * FROM parts WHERE id = $1', [id]);

    if (partResult.rows.length === 0) {
      throw new AppError('Part not found', 404);
    }

    const part = partResult.rows[0];
    const stock_before = part.current_stock;
    let stock_after = stock_before;

    // Calculate new stock
    if (action_type === '入庫') {
      stock_after = stock_before + quantity;
    } else if (action_type === '出庫') {
      stock_after = stock_before - quantity;
      if (stock_after < 0) {
        throw new AppError('Insufficient stock', 400);
      }
    } else if (action_type === '調整') {
      stock_after = quantity;
    }

    // Update part stock
    await query(
      'UPDATE parts SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [stock_after, id]
    );

    // Insert history record
    const historyResult = await query(
      `INSERT INTO part_history (part_id, action_type, quantity, stock_before, stock_after, performed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, action_type, quantity, stock_before, stock_after, req.user?.id, notes || null]
    );

    // Get updated part
    const updatedPartResult = await query('SELECT * FROM parts WHERE id = $1', [id]);

    // Create notification topic
    await createNotificationTopic(
      `在庫が${action_type}されました`,
      `${part.part_name}${part.part_number ? ' (' + part.part_number + ')' : ''} の在庫が${action_type}されました。(${stock_before}${part.unit} → ${stock_after}${part.unit})`,
      req.user?.id || 1
    );

    res.json({
      success: true,
      data: {
        part: updatedPartResult.rows[0],
        history: historyResult.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPartHistory = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT ph.*, u.username as performed_by_username
       FROM part_history ph
       LEFT JOIN users u ON ph.performed_by = u.id
       WHERE ph.part_id = $1
       ORDER BY ph.created_at DESC
       LIMIT 100`,
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

export const orderRequest = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { quantity, urgency, notes } = req.body;

    // Get part
    const partResult = await query('SELECT * FROM parts WHERE id = $1', [id]);

    if (partResult.rows.length === 0) {
      throw new AppError('Part not found', 404);
    }

    const part = partResult.rows[0];

    // Create history record
    await query(
      `INSERT INTO part_history (part_id, action_type, quantity, stock_before, stock_after, performed_by, notes)
       VALUES ($1, '発注', $2, $3, $3, $4, $5)`,
      [id, quantity, part.current_stock, req.user?.id, notes || null]
    );

    // Create notification for admins
    const title = `発注依頼: ${part.part_name}`;
    const message = `${part.part_name} の発注依頼があります。数量: ${quantity}${part.unit}。緊急度: ${urgency === 'urgent' ? '緊急' : '通常'}`;

    await query(
      `INSERT INTO notifications (type, title, message, entity_type, entity_id)
       SELECT 'order_request', $1, $2, 'part', $3
       FROM users WHERE role = 'admin'`,
      [title, message, id]
    );

    // Create topic notification
    await createNotificationTopic(
      title,
      message,
      req.user?.id || 1
    );

    res.json({
      success: true,
      message: 'Order request created successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStockParts = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(`
      SELECT * FROM parts
      WHERE is_active = true AND current_stock < min_stock
      ORDER BY
        unit_name NULLS LAST,
        CASE WHEN current_stock = 0 THEN 0 ELSE 1 END,
        (current_stock::float / min_stock) ASC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderRequests = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(
      `SELECT
        ph.id,
        ph.part_id,
        ph.quantity,
        ph.notes,
        ph.created_at,
        p.part_number,
        p.part_name,
        p.unit,
        p.current_stock,
        p.min_stock,
        u.username as requested_by_username,
        u.full_name as requested_by_full_name
       FROM part_history ph
       LEFT JOIN parts p ON ph.part_id = p.id
       LEFT JOIN users u ON ph.performed_by = u.id
       WHERE ph.action_type = '発注'
       ORDER BY ph.created_at DESC`,
      []
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};
