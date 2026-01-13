"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDayColor = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getDayColors = exports.getEvents = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
// カレンダーイベント一覧取得
const getEvents = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        let sql = `
      SELECT e.*, u.full_name as created_by_name
      FROM calendar_events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
        const values = [];
        if (year && month) {
            sql += ` AND EXTRACT(YEAR FROM e.date) = $1 AND EXTRACT(MONTH FROM e.date) = $2`;
            values.push(year, month);
        }
        sql += ` ORDER BY e.date ASC, e.created_at ASC`;
        const result = await (0, connection_1.query)(sql, values);
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getEvents = getEvents;
// 日付背景色一覧取得
const getDayColors = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        let sql = `SELECT * FROM calendar_day_colors WHERE 1=1`;
        const values = [];
        if (year && month) {
            sql += ` AND EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2`;
            values.push(year, month);
        }
        const result = await (0, connection_1.query)(sql, values);
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDayColors = getDayColors;
// イベント作成
const createEvent = async (req, res, next) => {
    try {
        const { date, title, description, color } = req.body;
        const userId = req.user?.id;
        if (!date || !title) {
            throw new errorHandler_1.AppError('日付とタイトルは必須です', 400);
        }
        const result = await (0, connection_1.query)(`INSERT INTO calendar_events (date, title, description, color, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [date, title, description || null, color || 'blue', userId]);
        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createEvent = createEvent;
// イベント更新
const updateEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date, title, description, color } = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (date !== undefined) {
            updates.push(`date = $${paramCount++}`);
            values.push(date);
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
        if (updates.length === 0) {
            throw new errorHandler_1.AppError('更新するフィールドがありません', 400);
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await (0, connection_1.query)(`UPDATE calendar_events SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`, values);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('イベントが見つかりません', 404);
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
exports.updateEvent = updateEvent;
// イベント削除
const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)('DELETE FROM calendar_events WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('イベントが見つかりません', 404);
        }
        res.json({
            success: true,
            message: 'イベントを削除しました',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteEvent = deleteEvent;
// 日付背景色の設定
const setDayColor = async (req, res, next) => {
    try {
        const { date, color } = req.body;
        const userId = req.user?.id;
        if (!date) {
            throw new errorHandler_1.AppError('日付は必須です', 400);
        }
        // 色が空またはnullの場合は削除
        if (!color) {
            await (0, connection_1.query)('DELETE FROM calendar_day_colors WHERE date = $1', [date]);
            return res.json({
                success: true,
                message: '日付の色を削除しました',
            });
        }
        const result = await (0, connection_1.query)(`INSERT INTO calendar_day_colors (date, color, created_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (date) DO UPDATE SET
         color = $2,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`, [date, color, userId]);
        res.json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.setDayColor = setDayColor;
//# sourceMappingURL=calendarController.js.map