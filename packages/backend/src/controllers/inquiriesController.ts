import { Response } from 'express';
import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Get all inquiries
export const getInquiries = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const result = await query(`
      SELECT
        i.*,
        u.username as created_by_username,
        u.full_name as created_by_full_name
      FROM inquiries i
      LEFT JOIN users u ON i.created_by_id = u.id
      ORDER BY i.created_at DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get single inquiry with replies
export const getInquiryById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    // Get inquiry
    const inquiryResult = await query(`
      SELECT
        i.*,
        u.username as created_by_username,
        u.full_name as created_by_full_name
      FROM inquiries i
      LEFT JOIN users u ON i.created_by_id = u.id
      WHERE i.id = $1
    `, [id]);

    if (inquiryResult.rows.length === 0) {
      throw new AppError('問い合わせが見つかりません', 404);
    }

    // Get replies
    const repliesResult = await query(`
      SELECT
        r.*,
        u.username as created_by_username,
        u.full_name as created_by_full_name
      FROM inquiry_replies r
      LEFT JOIN users u ON r.created_by_id = u.id
      WHERE r.inquiry_id = $1
      ORDER BY r.created_at ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        ...inquiryResult.rows[0],
        replies: repliesResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Create new inquiry
export const createInquiry = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { subject, message } = req.body;
    const userId = req.user?.id;

    if (!subject || !message) {
      throw new AppError('件名と内容は必須です', 400);
    }

    const result = await query(
      `INSERT INTO inquiries (subject, message, created_by_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [subject, message, userId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update inquiry status (leader or admin only)
export const updateInquiryStatus = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in_progress', 'resolved'].includes(status)) {
      throw new AppError('無効なステータスです', 400);
    }

    const result = await query(
      `UPDATE inquiries SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('問い合わせが見つかりません', 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Create reply (leader or admin only)
// Delete inquiry (leader or admin only)
export const deleteInquiry = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;

    // Delete replies first
    await query('DELETE FROM inquiry_replies WHERE inquiry_id = $1', [id]);

    // Delete inquiry
    const result = await query('DELETE FROM inquiries WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      throw new AppError('問い合わせが見つかりません', 404);
    }

    res.json({
      success: true,
      message: '問い合わせを削除しました',
    });
  } catch (error) {
    next(error);
  }
};

export const createReply = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    if (!message) {
      throw new AppError('返信内容は必須です', 400);
    }

    // Check if inquiry exists
    const inquiryResult = await query('SELECT id FROM inquiries WHERE id = $1', [id]);
    if (inquiryResult.rows.length === 0) {
      throw new AppError('問い合わせが見つかりません', 404);
    }

    // Create reply
    const result = await query(
      `INSERT INTO inquiry_replies (inquiry_id, message, created_by_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, message, userId]
    );

    // Get user info for response
    const replyWithUser = await query(`
      SELECT
        r.*,
        u.username as created_by_username,
        u.full_name as created_by_full_name
      FROM inquiry_replies r
      LEFT JOIN users u ON r.created_by_id = u.id
      WHERE r.id = $1
    `, [result.rows[0].id]);

    // Update inquiry status to in_progress if it was pending
    await query(
      `UPDATE inquiries SET status = 'in_progress', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'`,
      [id]
    );

    res.status(201).json({
      success: true,
      data: replyWithUser.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
