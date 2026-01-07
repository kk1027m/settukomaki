"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshAccessToken = exports.changePassword = exports.getMe = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../database/connection");
const auth_1 = require("../config/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        // Find user
        const result = await (0, connection_1.query)('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        }
        const user = result.rows[0];
        if (!user.is_active) {
            throw new errorHandler_1.AppError('Account is disabled', 403);
        }
        // Verify password
        const isValidPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        }
        // Generate tokens
        const tokenOptions = { expiresIn: auth_1.authConfig.jwtExpiresIn };
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, auth_1.authConfig.jwtSecret, tokenOptions);
        const refreshTokenOptions = { expiresIn: auth_1.authConfig.refreshTokenExpiresIn };
        const refreshToken = jsonwebtoken_1.default.sign({ id: user.id }, auth_1.authConfig.refreshTokenSecret, refreshTokenOptions);
        // Remove password from response
        const { password_hash, ...userWithoutPassword } = user;
        res.json({
            success: true,
            data: {
                token,
                refreshToken,
                user: userWithoutPassword,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const getMe = async (req, res, next) => {
    try {
        const result = await (0, connection_1.query)('SELECT id, username, email, role, full_name, is_active, created_at FROM users WHERE id = $1', [req.user?.id]);
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
exports.getMe = getMe;
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        // Get current user
        const result = await (0, connection_1.query)('SELECT password_hash FROM users WHERE id = $1', [req.user?.id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        const user = result.rows[0];
        // Verify current password
        const isValidPassword = await bcrypt_1.default.compare(currentPassword, user.password_hash);
        if (!isValidPassword) {
            throw new errorHandler_1.AppError('Current password is incorrect', 401);
        }
        // Hash new password
        const hashedPassword = await bcrypt_1.default.hash(newPassword, auth_1.authConfig.bcryptRounds);
        // Update password
        await (0, connection_1.query)('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, req.user?.id]);
        res.json({
            success: true,
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
const refreshAccessToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw new errorHandler_1.AppError('Refresh token is required', 400);
        }
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, auth_1.authConfig.refreshTokenSecret);
        // Get user
        const result = await (0, connection_1.query)('SELECT id, username, role FROM users WHERE id = $1 AND is_active = true', [decoded.id]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found or inactive', 404);
        }
        const user = result.rows[0];
        // Generate new access token
        const tokenOptions = { expiresIn: auth_1.authConfig.jwtExpiresIn };
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, auth_1.authConfig.jwtSecret, tokenOptions);
        res.json({
            success: true,
            data: { token },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.refreshAccessToken = refreshAccessToken;
//# sourceMappingURL=authController.js.map