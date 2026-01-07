"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInquiryStatus = exports.createInquiry = exports.getInquiries = void 0;
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
// Update inquiry status (admin only)
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
//# sourceMappingURL=inquiriesController.js.map