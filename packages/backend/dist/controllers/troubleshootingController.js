"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnitNames = exports.getMachineNames = exports.updateTroubleshootingSortOrder = exports.deleteTroubleshootingItem = exports.updateTroubleshootingItem = exports.createTroubleshootingItem = exports.getTroubleshootingItemById = exports.getTroubleshootingItems = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
// トラブルシューティング一覧取得
const getTroubleshootingItems = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)(`SELECT * FROM troubleshooting_items
       WHERE is_active = true
       ORDER BY sort_order ASC, machine_name ASC, unit_name ASC NULLS LAST, trouble_title ASC`);
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTroubleshootingItems = getTroubleshootingItems;
// トラブルシューティング詳細取得
const getTroubleshootingItemById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)(`SELECT t.*, u.full_name as created_by_name
       FROM troubleshooting_items t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = $1`, [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('トラブルシューティングが見つかりません', 404);
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
exports.getTroubleshootingItemById = getTroubleshootingItemById;
// トラブルシューティング作成
const createTroubleshootingItem = async (req, res, next) => {
    try {
        const { machine_name, unit_name, trouble_title, trouble_description, solution } = req.body;
        const userId = req.user?.id;
        if (!machine_name || !trouble_title) {
            throw new errorHandler_1.AppError('機械名とトラブル内容は必須です', 400);
        }
        const result = await (0, connection_1.query)(`INSERT INTO troubleshooting_items (machine_name, unit_name, trouble_title, trouble_description, solution, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`, [machine_name, unit_name || null, trouble_title, trouble_description || null, solution || null, userId]);
        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createTroubleshootingItem = createTroubleshootingItem;
// トラブルシューティング更新
const updateTroubleshootingItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { machine_name, unit_name, trouble_title, trouble_description, solution } = req.body;
        const updates = [];
        const values = [];
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
            throw new errorHandler_1.AppError('更新するフィールドがありません', 400);
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await (0, connection_1.query)(`UPDATE troubleshooting_items SET ${updates.join(', ')} WHERE id = $${paramCount} AND is_active = true RETURNING *`, values);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('トラブルシューティングが見つかりません', 404);
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
exports.updateTroubleshootingItem = updateTroubleshootingItem;
// トラブルシューティング削除
const deleteTroubleshootingItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)(`UPDATE troubleshooting_items SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('トラブルシューティングが見つかりません', 404);
        }
        res.json({
            success: true,
            message: 'トラブルシューティングを削除しました',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTroubleshootingItem = deleteTroubleshootingItem;
// 並び順更新
const updateTroubleshootingSortOrder = async (req, res, next) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            throw new errorHandler_1.AppError('items配列が必要です', 400);
        }
        for (const item of items) {
            await (0, connection_1.query)(`UPDATE troubleshooting_items SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [item.sort_order, item.id]);
        }
        res.json({
            success: true,
            message: '並び順を更新しました',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTroubleshootingSortOrder = updateTroubleshootingSortOrder;
// 機械名一覧取得
const getMachineNames = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)(`SELECT DISTINCT machine_name FROM troubleshooting_items WHERE is_active = true ORDER BY machine_name ASC`);
        res.json({
            success: true,
            data: result.rows.map(row => row.machine_name),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMachineNames = getMachineNames;
// ユニット名一覧取得
const getUnitNames = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)(`SELECT DISTINCT unit_name FROM troubleshooting_items WHERE is_active = true AND unit_name IS NOT NULL ORDER BY unit_name ASC`);
        res.json({
            success: true,
            data: result.rows.map(row => row.unit_name),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUnitNames = getUnitNames;
//# sourceMappingURL=troubleshootingController.js.map