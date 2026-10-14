import { Knex } from 'knex';
export declare const db: Knex;
export declare function checkDatabaseHealth(): Promise<boolean>;
export default db;
