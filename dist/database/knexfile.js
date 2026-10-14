"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const knexConfig = {
    development: {
        client: 'pg',
        connection: {
            host: env_1.config.db.host,
            port: env_1.config.db.port,
            user: env_1.config.db.user,
            password: env_1.config.db.password,
            database: env_1.config.db.database
        },
        pool: {
            min: 2,
            max: 20
        },
        migrations: {
            directory: path_1.default.resolve(__dirname, './migrations'),
            extension: 'ts',
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: path_1.default.resolve(__dirname, './seeds'),
            extension: 'ts'
        }
    },
    production: {
        client: 'pg',
        connection: {
            host: env_1.config.db.host,
            port: env_1.config.db.port,
            user: env_1.config.db.user,
            password: env_1.config.db.password,
            database: env_1.config.db.database,
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        },
        pool: {
            min: 5,
            max: 50
        },
        migrations: {
            directory: path_1.default.resolve(__dirname, './migrations'),
            extension: 'js',
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: path_1.default.resolve(__dirname, './seeds'),
            extension: 'js'
        }
    },
    test: {
        client: 'pg',
        connection: {
            host: env_1.config.db.host,
            port: env_1.config.db.port,
            user: env_1.config.db.user,
            password: env_1.config.db.password,
            database: `${env_1.config.db.database}_test`
        },
        pool: {
            min: 1,
            max: 5
        },
        migrations: {
            directory: path_1.default.resolve(__dirname, './migrations'),
            extension: 'ts',
            tableName: 'knex_migrations'
        }
    }
};
exports.default = knexConfig;
//# sourceMappingURL=knexfile.js.map