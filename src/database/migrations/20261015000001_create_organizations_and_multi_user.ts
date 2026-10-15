import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. organizations table
  const orgExists = await knex.schema.hasTable('organizations');
  if (!orgExists) {
    await knex.schema.createTable('organizations', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 150).notNullable();
      table.string('slug', 150).unique().nullable();
      table.string('registration_number', 50).nullable(); // BDB Office / Gala / GSTIN
      table.string('phone', 20).nullable();
      table.string('email', 150).nullable();
      table.string('city', 50).defaultTo('Mumbai');
      table.text('address').nullable();
      table.uuid('owner_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  // 2. Add organization_id and user_scope to users
  const hasOrgIdInUsers = await knex.schema.hasColumn('users', 'organization_id');
  if (!hasOrgIdInUsers) {
    await knex.schema.alterTable('users', (table) => {
      table.uuid('organization_id').nullable().references('id').inTable('organizations').onDelete('SET NULL');
      table.string('user_scope', 20).defaultTo('INDIVIDUAL'); // INDIVIDUAL (own books) or GLOBAL (all org books)
    });
  }

  // 3. Add organization_id and created_by_user_id to sales_orders
  const hasCreatedByInSales = await knex.schema.hasColumn('sales_orders', 'created_by_user_id');
  if (!hasCreatedByInSales) {
    await knex.schema.alterTable('sales_orders', (table) => {
      table.uuid('organization_id').nullable().references('id').inTable('organizations').onDelete('SET NULL');
      table.uuid('created_by_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.index(['organization_id', 'created_by_user_id']);
    });
  }

  // 4. Add organization_id to diamond_lots
  const hasOrgInLots = await knex.schema.hasColumn('diamond_lots', 'organization_id');
  if (!hasOrgInLots) {
    await knex.schema.alterTable('diamond_lots', (table) => {
      table.uuid('organization_id').nullable().references('id').inTable('organizations').onDelete('SET NULL');
      table.uuid('created_by_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    });
  }

  // 5. sms_notification_logs
  const smsExists = await knex.schema.hasTable('sms_notification_logs');
  if (!smsExists) {
    await knex.schema.createTable('sms_notification_logs', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('party_id').nullable().references('id').inTable('parties').onDelete('CASCADE');
      table.string('phone', 20).notNullable();
      table.text('message_body').notNullable();
      table.string('status', 30).defaultTo('SENT'); // SENT, DELIVERED, FAILED
      table.string('provider', 50).defaultTo('DLT_SMS_GATEWAY');
      table.string('reference_type', 50).nullable(); // PAYMENT_OVERDUE, REMINDER, PROMISE_DATE
      table.string('reference_id', 100).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index(['party_id', 'phone', 'status', 'created_at']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sms_notification_logs');

  if (await knex.schema.hasColumn('diamond_lots', 'organization_id')) {
    await knex.schema.alterTable('diamond_lots', (table) => {
      table.dropColumn('created_by_user_id');
      table.dropColumn('organization_id');
    });
  }

  if (await knex.schema.hasColumn('sales_orders', 'organization_id')) {
    await knex.schema.alterTable('sales_orders', (table) => {
      table.dropColumn('created_by_user_id');
      table.dropColumn('organization_id');
    });
  }

  if (await knex.schema.hasColumn('users', 'organization_id')) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('user_scope');
      table.dropColumn('organization_id');
    });
  }

  await knex.schema.dropTableIfExists('organizations');
}
