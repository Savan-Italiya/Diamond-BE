"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = auditLogger;
const connection_1 = require("../database/connection");
function auditLogger(tableName) {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        const userId = req.user?.userId || null;
        const action = req.method;
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        // Intercept response to capture post-state
        res.json = function (body) {
            // Execute audit asynchronously so response isn't delayed
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(action) && res.statusCode < 400) {
                const recordId = req.params.id || body?.data?.id || 'N/A';
                const newValue = ['POST', 'PUT', 'PATCH'].includes(action) ? JSON.stringify(req.body) : null;
                (0, connection_1.db)('system_audit_logs')
                    .insert({
                    user_id: userId,
                    action: `${action}_${tableName.toUpperCase()}`,
                    table_name: tableName,
                    record_id: String(recordId),
                    new_value_json: newValue,
                    ip_address: ipAddress
                })
                    .catch((err) => {
                    console.error('Audit log write error:', err.message);
                });
            }
            return originalJson(body);
        };
        next();
    };
}
//# sourceMappingURL=audit.middleware.js.map