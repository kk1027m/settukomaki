"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const schedulerService_1 = require("./services/schedulerService");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const lubrication_1 = __importDefault(require("./routes/lubrication"));
const parts_1 = __importDefault(require("./routes/parts"));
const replacements_1 = __importDefault(require("./routes/replacements"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const settings_1 = __importDefault(require("./routes/settings"));
const topics_1 = __importDefault(require("./routes/topics"));
const maintenanceProcedures_1 = __importDefault(require("./routes/maintenanceProcedures"));
const inquiries_1 = __importDefault(require("./routes/inquiries"));
const line_1 = __importDefault(require("./routes/line"));
const calendar_1 = __importDefault(require("./routes/calendar"));
const troubleshooting_1 = __importDefault(require("./routes/troubleshooting"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, res, next) => {
    logger_1.logger.info(`${req.method} ${req.url}`);
    next();
});
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        line: {
            hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
            tokenLength: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0
        }
    });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/lubrication', lubrication_1.default);
app.use('/api/parts', parts_1.default);
app.use('/api/replacements', replacements_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/uploads', uploads_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/topics', topics_1.default);
app.use('/api/maintenance-procedures', maintenanceProcedures_1.default);
app.use('/api/inquiries', inquiries_1.default);
app.use('/api/line', line_1.default);
app.use('/api/calendar', calendar_1.default);
app.use('/api/troubleshooting', troubleshooting_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});
// Error handler
app.use(errorHandler_1.errorHandler);
// Start server (only in non-serverless environment)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        logger_1.logger.info(`Server is running on port ${PORT}`);
        logger_1.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        // Initialize scheduler
        if (process.env.NODE_ENV !== 'test') {
            (0, schedulerService_1.initScheduler)();
        }
    });
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught Exception:', error);
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map