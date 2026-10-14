import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { db } from '../database/connection';

export function auditLogger(tableName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);
    const userId = req.user?.userId || null;
    const action = req.method;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    // Intercept response to capture post-state
    res.json = function (body: any): Response {
      // Execute audit asynchronously so response isn't delayed
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(action) && res.statusCode < 400) {
        const recordId = req.params.id || body?.data?.id || 'N/A';
        const newValue = ['POST', 'PUT', 'PATCH'].includes(action) ? JSON.stringify(req.body) : null;

        const auditTable = typeof db === 'function' ? db('system_audit_logs') : null;
        if (auditTable && typeof auditTable.insert === 'function') {
          auditTable
            .insert({
              user_id: userId,
              action: `${action}_${tableName.toUpperCase()}`,
              table_name: tableName,
              record_id: String(recordId),
              new_value_json: newValue,
              ip_address: ipAddress
            })
            .catch((err: any) => {
              console.error('Audit log write error:', err.message);
            });
        }
      }
      return originalJson(body);
    };

    next();
  };
}
