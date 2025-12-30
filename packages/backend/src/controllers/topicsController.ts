import { Response } from 'express';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Helper function to create automatic notification topics
export const createNotificationTopic = async (title: string, content: string, userId: number) => {
  try {
    await query(
      `INSERT INTO topics (title, content, posted_by)
       VALUES ($1, $2, $3)`,
      [title, content, userId]
    );
  } catch (error) {
    console.error('Failed to create notification topic:', error);
  }
};

// Get all topics (accessible by all authenticated users)
export const getTopics = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(`
      SELECT
        t.*,
        u.username as posted_by_username,
        u.full_name as posted_by_full_name
      FROM topics t
      LEFT JOIN users u ON t.posted_by = u.id
      ORDER BY t.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get single topic by ID
export const getTopic = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        t.*,
        u.username as posted_by_username,
        u.full_name as posted_by_full_name
      FROM topics t
      LEFT JOIN users u ON t.posted_by = u.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      throw new AppError('トピックが見つかりません', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Create topic (admin only)
export const createTopic = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      throw new AppError('タイトルと内容は必須です', 400);
    }

    const result = await query(
      `INSERT INTO topics (title, content, posted_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title, content, req.user?.id]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update topic (admin only)
export const updateTopic = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!title || !content) {
      throw new AppError('タイトルと内容は必須です', 400);
    }

    const result = await query(
      `UPDATE topics
       SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [title, content, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('トピックが見つかりません', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete topic (admin only)
export const deleteTopic = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM topics WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('トピックが見つかりません', 404);
    }

    res.json({
      success: true,
      message: 'トピックを削除しました',
    });
  } catch (error) {
    next(error);
  }
};
