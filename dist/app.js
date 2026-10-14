"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const auth_router_1 = __importDefault(require("./modules/auth/auth.router"));
const parties_router_1 = __importDefault(require("./modules/parties/parties.router"));
const inventory_router_1 = __importDefault(require("./modules/inventory/inventory.router"));
const memo_router_1 = __importDefault(require("./modules/memo/memo.router"));
const sales_router_1 = __importDefault(require("./modules/sales/sales.router"));
const processing_router_1 = __importDefault(require("./modules/processing/processing.router"));
const accounting_router_1 = __importDefault(require("./modules/accounting/accounting.router"));
const reminders_router_1 = __importDefault(require("./modules/reminders/reminders.router"));
const notifications_router_1 = __importDefault(require("./modules/notifications/notifications.router"));
const audit_router_1 = __importDefault(require("./modules/audit/audit.router"));
const error_middleware_1 = require("./middleware/error.middleware");
function createApp() {
    const app = (0, express_1.default)();
    // Standard Security & Utility Middlewares
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: '*', // In production, restrict to allowed origins e.g. web-admin domain
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    if (process.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('combined'));
    }
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
    // Health Check Endpoint
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'UP',
            service: 'Diamond Trading ERP Mumbai (BKC / Opera House)',
            timestamp: new Date().toISOString()
        });
    });
    // Mount API Modules
    app.use('/api/v1/auth', auth_router_1.default);
    app.use('/api/v1/parties', parties_router_1.default);
    app.use('/api/v1/inventory', inventory_router_1.default);
    app.use('/api/v1/memo', memo_router_1.default);
    app.use('/api/v1/sales', sales_router_1.default);
    app.use('/api/v1/processing', processing_router_1.default);
    app.use('/api/v1/accounting', accounting_router_1.default);
    app.use('/api/v1/reminders', reminders_router_1.default);
    app.use('/api/v1/notifications', notifications_router_1.default);
    app.use('/api/v1/audit', audit_router_1.default);
    // 404 Route Handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: {
                message: `Endpoint ${req.method} ${req.originalUrl} not found`,
                code: 'ROUTE_NOT_FOUND'
            }
        });
    });
    // Centralized Error Handling
    app.use(error_middleware_1.errorHandler);
    return app;
}
exports.default = createApp();
//# sourceMappingURL=app.js.map