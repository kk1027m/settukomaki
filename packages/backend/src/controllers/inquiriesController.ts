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

// Update inquiry status (admin only)
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
