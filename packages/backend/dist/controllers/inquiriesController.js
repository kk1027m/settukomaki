"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReply = exports.deleteInquiry = exports.updateInquiryStatus = exports.createInquiry = exports.getInquiryById = exports.getInquiries = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
// Get all inquiries
const getInquiries = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)(`
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
    }
    catch (error) {
        next(error);
    }
};
exports.getInquiries = getInquiries;
// Get single inquiry with replies
const getInquiryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Get inquiry
        const inquiryResult = await (0, connection_1.query)(`
      SELECT
        i.*,
        u.username as created_by_username,
        u.full_name as created_by_full_name
      FROM inquiries i
      LEFT JOIN users u ON i.created_by_id = u.id
      WHERE i.id = $1
    `, [id]);
        if (inquiryResult.rows.length === 0) {
            throw new errorHandler_1.AppError('問い合わせが見つかりません', 404);
        }
        // Get replies
        const repliesResult = await (0, connection_1.query)(`
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
    }
    catch (error) {
        next(error);
    }
};
exports.getInquiryById = getInquiryById;
// Create new inquiry
const createInquiry = async (req, res, next) => {
    try {
        const { subject, message } = req.body;
        const userId = req.user?.id;
        if (!subject || !message) {
            throw new errorHandler_1.AppError('件名と内容は必須です', 400);
        }
        const result = await (0, connection_1.query)(`INSERT INTO inquiries (subject, message, created_by_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`, [subject, message, userId]);
        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createInquiry = createInquiry;
// Update inquiry status (leader or admin only)
const updateInquiryStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['pending', 'in_progress', 'resolved'].includes(status)) {
            throw new errorHandler_1.AppError('無効なステータスです', 400);
        }
        const result = await (0, connection_1.query)(`UPDATE inquiries SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`, [status, id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('問い合わせが見つかりません', 404);
        }
        res.json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateInquiryStatus = updateInquiryStatus;
// Create reply (leader or admin only)
// Delete inquiry (leader or admin only)
const deleteInquiry = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Delete replies first
        await (0, connection_1.query)('DELETE FROM inquiry_replies WHERE inquiry_id = $1', [id]);
        // Delete inquiry
        const result = await (0, connection_1.query)('DELETE FROM inquiries WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('問い合わせが見つかりません', 404);
        }
        res.json({
            success: true,
            message: '問い合わせを削除しました',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteInquiry = deleteInquiry;
const createReply = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { message } = req.body;
        const userId = req.user?.id;
        if (!message) {
            throw new errorHandler_1.AppError('返信内容は必須です', 400);
        }
        // Check if inquiry exists
        const inquiryResult = await (0, connection_1.query)('SELECT id FROM inquiries WHERE id = $1', [id]);
        if (inquiryResult.rows.length === 0) {
            throw new errorHandler_1.AppError('問い合わせが見つかりません', 404);
        }
        // Create reply
        const result = await (0, connection_1.query)(`INSERT INTO inquiry_replies (inquiry_id, message, created_by_id)
       VALUES ($1, $2, $3)
       RETURNING *`, [id, message, userId]);
        // Get user info for response
        const replyWithUser = await (0, connection_1.query)(`
      SELECT
        r.*,
        u.username as created_by_username,
        u.full_name as created_by_full_name
      FROM inquiry_replies r
      LEFT JOIN users u ON r.created_by_id = u.id
      WHERE r.id = $1
    `, [result.rows[0].id]);
        // Update inquiry status to in_progress if it was pending
        await (0, connection_1.query)(`UPDATE inquiries SET status = 'in_progress', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'`, [id]);
        res.status(201).json({
            success: true,
            data: replyWithUser.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createReply = createReply;
//# sourceMappingURL=inquiriesController.js.map