"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireLeaderOrAdmin = exports.requireAdmin = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("../config/auth");
const errorHandler_1 = require("./errorHandler");
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('No token provided', 401);
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, auth_1.authConfig.jwtSecret);
        req.user = {
            id: decoded.id,
            username: decoded.username,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errorHandler_1.AppError('Invalid token', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return next(new errorHandler_1.AppError('Admin access required', 403));
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireLeaderOrAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'leader') {
        return next(new errorHandler_1.AppError('Leader or Admin access required', 403));
    }
    next();
};
exports.requireLeaderOrAdmin = requireLeaderOrAdmin;
//# sourceMappingURL=auth.js.map