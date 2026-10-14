import type { Knex } from 'knex';
import path from 'path';
import { config } from '../config/env';

const knexConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database
    },
    pool: {
      min: 2,
      max: 20
    },
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      extension: 'ts',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.resolve(__dirname, './seeds'),
      extension: 'ts'
    }
  },
  production: {
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: {
      min: 5,
      max: 50
    },
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      extension: 'js',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: path.resolve(__dirname, './seeds'),
      extension: 'js'
    }
  },
  test: {
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: `${config.db.database}_test`
    },
    pool: {
      min: 1,
      max: 5
    },
    migrations: {
      directory: path.resolve(__dirname, './migrations'),
      extension: 'ts',
      tableName: 'knex_migrations'
    }
  }
};

export default knexConfig;
