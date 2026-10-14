"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.AuthService.login(email, password);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async me(req, res, next) {
        try {
            res.status(200).json({
                success: true,
                data: req.user
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map