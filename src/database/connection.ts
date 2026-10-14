import knex, { Knex } from 'knex';
import knexConfig from './knexfile';
import { config } from '../config/env';

const environment = config.env;
const dbConfig = knexConfig[environment] || knexConfig.development;

export const db: Knex = knex(dbConfig);

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export default db;
