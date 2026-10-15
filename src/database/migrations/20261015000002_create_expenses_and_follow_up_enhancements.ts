import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Expenses / Kharcha tracking table
  await knex.schema.createTableIfNotExists('expenses', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('category', 80).notNullable();          // TRAVEL, OFFICE, COMM, BANK_CHARGES, etc.
    t.string('description', 500).notNullable();
    t.decimal('amount', 14, 2).notNullable();
    t.string('paid_to', 200).nullable();
    t.string('payment_mode', 40).defaultTo('CASH');  // CASH, UPI, NEFT, CARD
    t.date('expense_date').notNullable().defaultTo(knex.fn.now());
    t.string('receipt_url', 500).nullable();
    t.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    t.uuid('organization_id').nullable().references('id').inTable('organizations').onDelete('SET NULL');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Add 'call_status' column to follow_up_logs if not present
  const hasCallStatus = await knex.schema.hasColumn('follow_up_logs', 'call_status');
  if (!hasCallStatus) {
    await knex.schema.alterTable('follow_up_logs', (t) => {
      t.string('call_status', 40).nullable();   // PAID, PROMISED, RESCHEDULED, NO_ANSWER, DISPUTED
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('expenses');
}
