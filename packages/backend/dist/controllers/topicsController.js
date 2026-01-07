"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTopic = exports.updateTopic = exports.createTopic = exports.getTopic = exports.getTopics = exports.createNotificationTopic = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
// Helper function to create automatic notification topics
const createNotificationTopic = async (title, content, userId) => {
    try {
        await (0, connection_1.query)(`INSERT INTO topics (title, content, posted_by)
       VALUES ($1, $2, $3)`, [title, content, userId]);
    }
    catch (error) {
        console.error('Failed to create notification topic:', error);
    }
};
exports.createNotificationTopic = createNotificationTopic;
// Get all topics (accessible by all authenticated users)
const getTopics = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)(`
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
    }
    catch (error) {
        next(error);
    }
};
exports.getTopics = getTopics;
// Get single topic by ID
const getTopic = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)(`
      SELECT
        t.*,
        u.username as posted_by_username,
        u.full_name as posted_by_full_name
      FROM topics t
      LEFT JOIN users u ON t.posted_by = u.id
      WHERE t.id = $1
    `, [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('トピックが見つかりません', 404);
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
exports.getTopic = getTopic;
// Create topic (admin only)
const createTopic = async (req, res, next) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            throw new errorHandler_1.AppError('タイトルと内容は必須です', 400);
        }
        const result = await (0, connection_1.query)(`INSERT INTO topics (title, content, posted_by)
       VALUES ($1, $2, $3)
       RETURNING *`, [title, content, req.user?.id]);
        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTopic = createTopic;
// Update topic (admin only)
const updateTopic = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        if (!title || !content) {
            throw new errorHandler_1.AppError('タイトルと内容は必須です', 400);
        }
        const result = await (0, connection_1.query)(`UPDATE topics
       SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`, [title, content, id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('トピックが見つかりません', 404);
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
exports.updateTopic = updateTopic;
// Delete topic (admin only)
const deleteTopic = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)('DELETE FROM topics WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('トピックが見つかりません', 404);
        }
        res.json({
            success: true,
            message: 'トピックを削除しました',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTopic = deleteTopic;
//# sourceMappingURL=topicsController.js.map