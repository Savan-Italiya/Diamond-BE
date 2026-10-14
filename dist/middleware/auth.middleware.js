"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: { message: 'Authentication required. Missing or invalid Authorization header.', code: 'UNAUTHORIZED' }
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({
            success: false,
            error: { message: 'Token is invalid or expired.', code: 'INVALID_TOKEN' }
        });
    }
}
//# sourceMappingURL=auth.middleware.js.map