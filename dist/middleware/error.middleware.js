"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, _next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    console.error(`[${req.method} ${req.url}] Error:`, err);
    res.status(statusCode).json({
        success: false,
        error: {
            message: err.message || 'An unexpected internal server error occurred.',
            code,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
}
//# sourceMappingURL=error.middleware.js.map