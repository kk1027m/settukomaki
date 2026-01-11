"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const connection_1 = require("../database/connection");
const auth_1 = require("../config/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const getUsers = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)('SELECT id, username, role, full_name, is_active, created_at, updated_at FROM users ORDER BY created_at DESC');
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await (0, connection_1.query)('SELECT id, username, role, full_name, is_active, created_at, updated_at FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
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
exports.getUserById = getUserById;
const createUser = async (req, res, next) => {
    try {
        const { username, password, role, full_name } = req.body;
        // Hash password
        const password_hash = await bcrypt_1.default.hash(password, auth_1.authConfig.bcryptRounds);
        const result = await (0, connection_1.query)(`INSERT INTO users (username, email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, role, full_name, is_active, created_at`, [username, username + '@local', password_hash, role, full_name || null]);
        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        if (error.code === '23505') {
            next(new errorHandler_1.AppError('Username or email already exists', 409));
        }
        else {
            next(error);
        }
    }
};
exports.createUser = createUser;
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, full_name, is_active, password } = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (role !== undefined) {
            updates.push(`role = $${paramCount++}`);
            values.push(role);
        }
        if (full_name !== undefined) {
            updates.push(`full_name = $${paramCount++}`);
            values.push(full_name);
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramCount++}`);
            values.push(is_active);
        }
        if (password !== undefined) {
            const password_hash = await bcrypt_1.default.hash(password, auth_1.authConfig.bcryptRounds);
            updates.push(`password_hash = $${paramCount++}`);
            values.push(password_hash);
        }
        if (updates.length === 0) {
            throw new errorHandler_1.AppError('No fields to update', 400);
        }
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        const result = await (0, connection_1.query)(`UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, username, role, full_name, is_active, updated_at`, values);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
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
exports.updateUser = updateUser;
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Prevent self-deletion
        if (parseInt(id) === req.user?.id) {
            throw new errorHandler_1.AppError('Cannot delete your own account', 400);
        }
        // Soft delete by setting is_active to false
        const result = await (0, connection_1.query)('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=userController.js.map