"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSortOrder = exports.getOrderRequests = exports.getLowStockParts = exports.orderRequest = exports.getPartHistory = exports.adjustStock = exports.deletePart = exports.updatePart = exports.createPart = exports.getPartById = exports.getParts = void 0;
const connection_1 = require("../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
const topicsController_1 = require("./topicsController");
const getParts = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)(`
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
        p.sort_order ASC,
        p.part_name
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
exports.getParts = getParts;
const getPartById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)('SELECT * FROM parts WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Part not found', 404);
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
exports.getPartById = getPartById;
const createPart = async (req, res, next) => {
    try {
        const { part_number, part_name, current_stock, min_stock, unit, unit_name, location, shelf_box_name, description, order_request_quantity, ordered_quantity } = req.body;
        const result = await (0, connection_1.query)(`INSERT INTO parts (part_number, part_name, current_stock, min_stock, unit, unit_name, location, shelf_box_name, description, created_by, order_request_quantity, ordered_quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`, [part_number || null, part_name, current_stock, min_stock, unit, unit_name || null, location || null, shelf_box_name || null, description || null, req.user?.id, order_request_quantity || 0, ordered_quantity || 0]);
        // Create notification topic
        const partData = result.rows[0];
        await (0, topicsController_1.createNotificationTopic)('部品が追加されました', `${part_name}${part_number ? ' (' + part_number + ')' : ''} が在庫に追加されました。`, req.user?.id || 1, 'part', partData.id);
        res.status(201).json({
            success: true,
            data: partData,
        });
    }
    catch (error) {
        if (error.code === '23505') {
            next(new errorHandler_1.AppError('Part number already exists', 409));
        }
        else {
            next(error);
        }
    }
};
exports.createPart = createPart;
const updatePart = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { part_number, part_name, current_stock, min_stock, unit, unit_name, location, shelf_box_name, description, is_active, order_request_quantity, ordered_quantity } = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (part_number !== undefined) {
            updates.push(`part_number = $${paramCount++}`);
            values.push(part_number);
        }
        if (part_name !== undefined) {
            updates.push(`part_name = $${paramCount++}`);
            values.push(part_name);
        }
        if (current_stock !== undefined) {
            updates.push(`current_stock = $${paramCount++}`);
            values.push(current_stock);
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
        if (order_request_quantity !== undefined) {
            updates.push(`order_request_quantity = $${paramCount++}`);
            values.push(order_request_quantity);
        }
        if (ordered_quantity !== undefined) {
            updates.push(`ordered_quantity = $${paramCount++}`);
            values.push(ordered_quantity);
        }
        if (updates.length === 0) {
            throw new errorHandler_1.AppError('No fields to update', 400);
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await (0, connection_1.query)(`UPDATE parts SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`, values);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Part not found', 404);
        }
        // Create notification topic for edit
        const updatedPart = result.rows[0];
        await (0, topicsController_1.createNotificationTopic)('部品情報が編集されました', `部品番号: ${updatedPart.part_number} - ${updatedPart.part_name} の情報が編集されました。`, req.user?.id || 1, 'part', updatedPart.id);
        res.json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePart = updatePart;
const deletePart = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)('DELETE FROM parts WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Part not found', 404);
        }
        res.json({
            success: true,
            message: 'Part deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePart = deletePart;
const adjustStock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action_type, quantity, notes, reduce_ordered } = req.body;
        // Get current part
        const partResult = await (0, connection_1.query)('SELECT * FROM parts WHERE id = $1', [id]);
        if (partResult.rows.length === 0) {
            throw new errorHandler_1.AppError('Part not found', 404);
        }
        const part = partResult.rows[0];
        const stock_before = part.current_stock;
        let stock_after = stock_before;
        let ordered_quantity_after = part.ordered_quantity || 0;
        let historyActionType = action_type;
        // Calculate new stock and min_stock adjustment
        let min_stock_after = part.min_stock;
        let ordered_quantity_reduction = 0;
        if (action_type === '入庫') {
            stock_after = stock_before + quantity;
            // 発注済が1以上の場合、入庫数分を減らす（0未満にはならない）
            if (ordered_quantity_after >= 1) {
                ordered_quantity_reduction = Math.min(ordered_quantity_after, quantity);
                ordered_quantity_after = ordered_quantity_after - ordered_quantity_reduction;
            }
        }
        else if (action_type === '出庫') {
            stock_after = stock_before - quantity;
            if (stock_after < 0) {
                throw new errorHandler_1.AppError('Insufficient stock', 400);
            }
        }
        else if (action_type === '調整') {
            stock_after = quantity;
        }
        else if (action_type === '発注済') {
            // 発注依頼から指定数量をマイナスし、発注済(ordered_quantity)にプラス
            const order_request_qty = part.order_request_quantity || 0;
            if (quantity > order_request_qty) {
                throw new errorHandler_1.AppError('発注依頼数量を超えています', 400);
            }
            // 在庫は変わらない
            stock_after = stock_before;
        }
        // Update part stock and ordered_quantity
        if (action_type === '発注済') {
            await (0, connection_1.query)('UPDATE parts SET order_request_quantity = order_request_quantity - $1, ordered_quantity = ordered_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [quantity, id]);
        }
        else if (action_type === '入庫' && ordered_quantity_reduction > 0) {
            // 入庫時、発注済から減算する
            await (0, connection_1.query)('UPDATE parts SET current_stock = $1, ordered_quantity = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [stock_after, ordered_quantity_after, id]);
        }
        else {
            await (0, connection_1.query)('UPDATE parts SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [stock_after, id]);
        }
        // Insert history record
        const historyResult = await (0, connection_1.query)(`INSERT INTO part_history (part_id, action_type, quantity, stock_before, stock_after, performed_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [id, historyActionType, quantity, stock_before, stock_after, req.user?.id, notes || null]);
        // Get updated part
        const updatedPartResult = await (0, connection_1.query)('SELECT * FROM parts WHERE id = $1', [id]);
        // Create notification topic
        await (0, topicsController_1.createNotificationTopic)(`在庫が${action_type}されました`, `${part.part_name}${part.part_number ? ' (' + part.part_number + ')' : ''} の在庫が${action_type}されました。(${stock_before}${part.unit} → ${stock_after}${part.unit})`, req.user?.id || 1, 'part', part.id);
        res.json({
            success: true,
            data: {
                part: updatedPartResult.rows[0],
                history: historyResult.rows[0],
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.adjustStock = adjustStock;
const getPartHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)(`SELECT ph.*, u.username as performed_by_username
       FROM part_history ph
       LEFT JOIN users u ON ph.performed_by = u.id
       WHERE ph.part_id = $1
       ORDER BY ph.created_at DESC
       LIMIT 100`, [id]);
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPartHistory = getPartHistory;
const orderRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { quantity, urgency, notes } = req.body;
        // Get part
        const partResult = await (0, connection_1.query)('SELECT * FROM parts WHERE id = $1', [id]);
        if (partResult.rows.length === 0) {
            throw new errorHandler_1.AppError('Part not found', 404);
        }
        const part = partResult.rows[0];
        // Update order_request_quantity
        await (0, connection_1.query)('UPDATE parts SET order_request_quantity = order_request_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [quantity, id]);
        // Create history record
        await (0, connection_1.query)(`INSERT INTO part_history (part_id, action_type, quantity, stock_before, stock_after, performed_by, notes)
       VALUES ($1, '発注', $2, $3, $3, $4, $5)`, [id, quantity, part.current_stock, req.user?.id, notes || null]);
        // Create notification for admins
        const title = `発注依頼: ${part.part_name}`;
        const message = `${part.part_name}${part.part_number ? ' (' + part.part_number + ')' : ''} の発注依頼があります。数量: ${quantity}${part.unit}。緊急度: ${urgency === 'urgent' ? '緊急' : '通常'}`;
        await (0, connection_1.query)(`INSERT INTO notifications (type, title, message, entity_type, entity_id)
       SELECT 'order_request', $1, $2, 'part', $3
       FROM users WHERE role = 'admin'`, [title, message, id]);
        // Create topic notification
        await (0, topicsController_1.createNotificationTopic)(title, message, req.user?.id || 1, 'part', part.id);
        res.json({
            success: true,
            message: 'Order request created successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.orderRequest = orderRequest;
const getLowStockParts = async (req, res, next) => {
    try {
        // 発注依頼がある部品を取得
        const result = await (0, connection_1.query)(`
      SELECT * FROM parts
      WHERE is_active = true AND order_request_quantity > 0
      ORDER BY
        unit_name NULLS LAST,
        order_request_quantity DESC
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
exports.getLowStockParts = getLowStockParts;
const getOrderRequests = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)(`SELECT
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
       ORDER BY ph.created_at DESC`, []);
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderRequests = getOrderRequests;
// 並び替え順序を更新
const updateSortOrder = async (req, res, next) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            throw new errorHandler_1.AppError('Invalid request body', 400);
        }
        for (const item of items) {
            await (0, connection_1.query)('UPDATE parts SET sort_order = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [item.sort_order, item.id]);
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
exports.updateSortOrder = updateSortOrder;
//# sourceMappingURL=partController.js.map