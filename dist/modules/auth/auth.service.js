"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const connection_1 = require("../../database/connection");
const env_1 = require("../../config/env");
const error_middleware_1 = require("../../middleware/error.middleware");
class AuthService {
    static async login(email, password) {
        const user = await (0, connection_1.db)('users').where({ email }).first();
        if (!user || user.status !== 'ACTIVE') {
            throw new error_middleware_1.AppError('Invalid credentials or inactive account', 401, 'INVALID_CREDENTIALS');
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            throw new error_middleware_1.AppError('Invalid credentials or inactive account', 401, 'INVALID_CREDENTIALS');
        }
        // Fetch roles and permissions
        const roles = await (0, connection_1.db)('user_roles')
            .join('roles', 'user_roles.role_id', 'roles.id')
            .where('user_roles.user_id', user.id)
            .select('roles.role_name');
        const roleNames = roles.map((r) => r.role_name);
        const permissions = await (0, connection_1.db)('role_permissions')
            .join('roles', 'role_permissions.role_id', 'roles.id')
            .join('permissions', 'role_permissions.permission_id', 'permissions.id')
            .whereIn('roles.role_name', roleNames)
            .select('permissions.permission_code');
        const permissionCodes = Array.from(new Set(permissions.map((p) => p.permission_code)));
        const payload = {
            userId: user.id,
            name: user.name,
            email: user.email,
            roles: roleNames,
            permissions: permissionCodes
        };
        const token = jsonwebtoken_1.default.sign(payload, env_1.config.jwt.secret, {
            expiresIn: env_1.config.jwt.expiresIn
        });
        const { password_hash, ...safeUser } = user;
        return {
            token,
            user: {
                ...safeUser,
                roles: roleNames,
                permissions: permissionCodes
            }
        };
    }
    static async register(data) {
        const existing = await (0, connection_1.db)('users')
            .where('email', data.email)
            .orWhere('phone', data.phone)
            .first();
        if (existing) {
            throw new error_middleware_1.AppError('User with email or phone already exists', 409, 'USER_EXISTS');
        }
        const password_hash = await bcryptjs_1.default.hash(data.password, 10);
        const [newUser] = await (0, connection_1.db)('users')
            .insert({
            name: data.name,
            phone: data.phone,
            email: data.email,
            password_hash,
            status: 'ACTIVE'
        })
            .returning(['id', 'name', 'phone', 'email', 'status', 'created_at']);
        // Assign roles
        if (data.roleNames && data.roleNames.length > 0) {
            const roles = await (0, connection_1.db)('roles').whereIn('role_name', data.roleNames);
            for (const role of roles) {
                await (0, connection_1.db)('user_roles').insert({
                    user_id: newUser.id,
                    role_id: role.id
                });
            }
        }
        return newUser;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map