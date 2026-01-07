"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProcedureSortOrder = exports.getUnitNames = exports.getMachineNames = exports.deleteComment = exports.createComment = exports.deleteProcedure = exports.updateProcedure = exports.createProcedure = exports.getProcedure = exports.getProcedures = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const topicsController_1 = require("./topicsController");
// Get all procedures with optional filters
const getProcedures = async (req, res, next) => {
    try {
        const { category, machine_name, unit_name, search } = req.query;
        let sql = `
      SELECT
        mp.*,
        u.username as created_by_username,
        u.full_name as created_by_full_name
      FROM maintenance_procedures mp
      LEFT JOIN users u ON mp.created_by = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramIndex = 1;
        if (category) {
            sql += ` AND mp.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        if (machine_name) {
            sql += ` AND mp.machine_name = $${paramIndex}`;
            params.push(machine_name);
            paramIndex++;
        }
        if (unit_name) {
            sql += ` AND mp.unit_name = $${paramIndex}`;
            params.push(unit_name);
            paramIndex++;
        }
        if (search) {
            sql += ` AND (mp.title ILIKE $${paramIndex} OR mp.content ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        sql += ' ORDER BY mp.sort_order ASC, mp.machine_name NULLS LAST, mp.unit_name NULLS LAST, mp.created_at DESC';
        const result = await (0, connection_1.query)(sql, params);
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProcedures = getProcedures;
// Get single procedure with comments
const getProcedure = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Get procedure
        const procedureResult = await (0, connection_1.query)(`
      SELECT
        mp.*,
        u.username as created_by_username,
        u.full_name as created_by_full_name
      FROM maintenance_procedures mp
      LEFT JOIN users u ON mp.created_by = u.id
      WHERE mp.id = $1
    `, [id]);
        if (procedureResult.rows.length === 0) {
            throw new errorHandler_1.AppError('手順が見つかりません', 404);
        }
        // Get comments
        const commentsResult = await (0, connection_1.query)(`
      SELECT
        pc.*,
        u.username as commented_by_username,
        u.full_name as commented_by_full_name
      FROM procedure_comments pc
      LEFT JOIN users u ON pc.commented_by = u.id
      WHERE pc.procedure_id = $1
      ORDER BY pc.created_at ASC
    `, [id]);
        res.json({
            success: true,
            data: {
                ...procedureResult.rows[0],
                comments: commentsResult.rows,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProcedure = getProcedure;
// Create procedure (admin only)
const createProcedure = async (req, res, next) => {
    try {
        const { title, content, category, machine_name, unit_name } = req.body;
        if (!title || !content || !category) {
            throw new errorHandler_1.AppError('タイトル、内容、カテゴリは必須です', 400);
        }
        const result = await (0, connection_1.query)(`INSERT INTO maintenance_procedures (title, content, category, machine_name, unit_name, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [title, content, category, machine_name || null, unit_name || null, req.user?.id]);
        // Create notification topic
        const procedureData = result.rows[0];
        await (0, topicsController_1.createNotificationTopic)('作業手順が追加されました', `${title} の作業手順が追加されました。`, req.user?.id || 1);
        res.status(201).json({
            success: true,
            data: procedureData,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createProcedure = createProcedure;
// Update procedure (admin only)
const updateProcedure = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, category, machine_name, unit_name } = req.body;
        if (!title || !content || !category) {
            throw new errorHandler_1.AppError('タイトル、内容、カテゴリは必須です', 400);
        }
        const result = await (0, connection_1.query)(`UPDATE maintenance_procedures
       SET title = $1, content = $2, category = $3, machine_name = $4,
           unit_name = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`, [title, content, category, machine_name || null, unit_name || null, id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('手順が見つかりません', 404);
        }
        // Create notification topic for edit
        const updatedProcedure = result.rows[0];
        await (0, topicsController_1.createNotificationTopic)('作業手順が編集されました', `${updatedProcedure.category === 'machine' ? '機械別' : '共通'} - ${updatedProcedure.title} の作業手順が編集されました。`, req.user?.id || 1);
        res.json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProcedure = updateProcedure;
// Delete procedure (admin only)
const deleteProcedure = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)('DELETE FROM maintenance_procedures WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('手順が見つかりません', 404);
        }
        res.json({
            success: true,
            message: '手順を削除しました',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProcedure = deleteProcedure;
// Create comment (all authenticated users)
const createComment = async (req, res, next) => {
    try {
        const { procedure_id } = req.params;
        const { content } = req.body;
        if (!content) {
            throw new errorHandler_1.AppError('コメント内容は必須です', 400);
        }
        const result = await (0, connection_1.query)(`INSERT INTO procedure_comments (procedure_id, content, commented_by)
       VALUES ($1, $2, $3)
       RETURNING *`, [procedure_id, content, req.user?.id]);
        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createComment = createComment;
// Delete comment (admin only or comment owner)
const deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if user owns the comment or is admin
        const commentResult = await (0, connection_1.query)('SELECT commented_by FROM procedure_comments WHERE id = $1', [id]);
        if (commentResult.rows.length === 0) {
            throw new errorHandler_1.AppError('コメントが見つかりません', 404);
        }
        const comment = commentResult.rows[0];
        const isOwner = comment.commented_by === req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        if (!isOwner && !isAdmin) {
            throw new errorHandler_1.AppError('このコメントを削除する権限がありません', 403);
        }
        await (0, connection_1.query)('DELETE FROM procedure_comments WHERE id = $1', [id]);
        res.json({
            success: true,
            message: 'コメントを削除しました',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteComment = deleteComment;
// Get unique machine names (for filter)
const getMachineNames = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)(`
      SELECT DISTINCT machine_name
      FROM maintenance_procedures
      WHERE machine_name IS NOT NULL
      ORDER BY machine_name
    `);
        res.json({
            success: true,
            data: result.rows.map(r => r.machine_name),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMachineNames = getMachineNames;
// Get unique unit names (for filter)
const getUnitNames = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)(`
      SELECT DISTINCT unit_name
      FROM maintenance_procedures
      WHERE unit_name IS NOT NULL
      ORDER BY unit_name
    `);
        res.json({
            success: true,
            data: result.rows.map(r => r.unit_name),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUnitNames = getUnitNames;
// Update sort order (admin only)
const updateProcedureSortOrder = async (req, res, next) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            throw new errorHandler_1.AppError('Invalid request body', 400);
        }
        for (const item of items) {
            await (0, connection_1.query)('UPDATE maintenance_procedures SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [item.sort_order, item.id]);
        }
        res.json({
            success: true,
            message: 'Sort order updated successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProcedureSortOrder = updateProcedureSortOrder;
//# sourceMappingURL=maintenanceProceduresController.js.map