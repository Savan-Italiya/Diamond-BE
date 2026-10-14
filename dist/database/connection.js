"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.checkDatabaseHealth = checkDatabaseHealth;
const knex_1 = __importDefault(require("knex"));
const knexfile_1 = __importDefault(require("./knexfile"));
const env_1 = require("../config/env");
const environment = env_1.config.env;
const dbConfig = knexfile_1.default[environment] || knexfile_1.default.development;
exports.db = (0, knex_1.default)(dbConfig);
async function checkDatabaseHealth() {
    try {
        await exports.db.raw('SELECT 1');
        return true;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}
exports.default = exports.db;
//# sourceMappingURL=connection.js.map