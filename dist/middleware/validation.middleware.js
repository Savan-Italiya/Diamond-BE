"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const zod_1 = require("zod");
function validateRequest(schema) {
    return async (req, res, next) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: 'Validation failed for request data',
                        code: 'VALIDATION_ERROR',
                        details: error.errors.map((e) => ({
                            path: e.path.join('.'),
                            message: e.message
                        }))
                    }
                });
                return;
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validation.middleware.js.map