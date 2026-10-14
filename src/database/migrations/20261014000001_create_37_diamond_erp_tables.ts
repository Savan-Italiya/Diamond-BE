import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable pgcrypto for gen_random_uuid() if supported
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"').catch(() => {
    // Graceful fallback for non-pg or environments without extension privileges
  });

  // ==========================================
  // MODULE 1: AUTH, USERS & RBAC (Tables 1 - 5)
  // ==========================================

  // 1. users
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('phone', 20).unique().notNullable();
    table.string('email', 150).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('status', 20).notNullable().defaultTo('ACTIVE'); // ACTIVE, SUSPENDED, INACTIVE
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['phone', 'email', 'status']);
  });

  // 2. roles
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('role_name', 50).unique().notNullable(); // SUPER_ADMIN, TRADER, ACCOUNTANT, BROKER, KARKHANA_SUPERVISOR
    table.string('description', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. user_roles
  await knex.schema.createTable('user_roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.unique(['user_id', 'role_id']);
  });

  // 4. permissions
  await knex.schema.createTable('permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('permission_code', 100).unique().notNullable(); // e.g. INVENTORY_VIEW, MEMO_CREATE, LEDGER_EDIT
    table.string('module', 50).notNullable(); // INVENTORY, MEMO, SALES, ACCOUNTING, RBAC
    table.string('description', 255).nullable();
  });

  // 5. role_permissions
  await knex.schema.createTable('role_permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.unique(['role_id', 'permission_id']);
  });

  // ====================================================
  // MODULE 2: PARTY & BROKER DIRECTORY (Tables 6 - 9)
  // ====================================================

  // 6. parties
  await knex.schema.createTable('parties', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('business_name', 150).notNullable();
    table.string('owner_name', 100).notNullable();
    table.string('phone_primary', 20).notNullable();
    table.string('phone_secondary', 20).nullable();
    table.string('gstin', 20).nullable();
    table.string('pan', 15).nullable();
    table.string('party_type', 30).notNullable(); // BUYER, SELLER, BROKER, PROCESSOR
    table.decimal('credit_limit', 15, 2).defaultTo(0.00);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['business_name', 'phone_primary', 'party_type']);
  });

  // 7. party_addresses
  await knex.schema.createTable('party_addresses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('CASCADE');
    table.string('address_line', 255).notNullable();
    table.string('city', 100).notNullable().defaultTo('Mumbai');
    table.string('state', 100).notNullable().defaultTo('Maharashtra');
    table.string('pincode', 20).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 8. party_bank_details
  await knex.schema.createTable('party_bank_details', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('CASCADE');
    table.string('bank_name', 100).notNullable();
    table.string('account_no', 50).notNullable();
    table.string('ifsc', 20).notNullable();
    table.string('upi_id', 100).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 9. brokers
  await knex.schema.createTable('brokers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('CASCADE');
    table.decimal('default_commission_rate', 5, 2).notNullable().defaultTo(1.00); // e.g. 1.00%
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ====================================================
  // MODULE 3: DIAMOND INVENTORY & LOTS (Tables 10 - 14)
  // ====================================================

  // 10. diamond_categories
  await knex.schema.createTable('diamond_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('category_name', 50).unique().notNullable(); // ROUGH, POLISHED, PARCEL_LOT, SOLITAIRE
    table.string('description', 255).nullable();
  });

  // 11. diamond_lots
  await knex.schema.createTable('diamond_lots', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('lot_number', 50).unique().notNullable();
    table.uuid('category_id').nullable().references('id').inTable('diamond_categories').onDelete('SET NULL');
    table.decimal('total_carat', 12, 4).notNullable();
    table.decimal('current_carat', 12, 4).notNullable();
    table.decimal('cost_per_carat', 15, 2).notNullable();
    table.date('purchase_date').notNullable();
    table.string('status', 30).notNullable().defaultTo('IN_STOCK'); // IN_STOCK, SOLD, IN_PROCESS, MEMO
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['lot_number', 'status']);
  });

  // 12. single_diamonds
  await knex.schema.createTable('single_diamonds', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lot_id').nullable().references('id').inTable('diamond_lots').onDelete('SET NULL');
    table.string('cert_type', 20).notNullable().defaultTo('NON_CERT'); // GIA, IGI, HRD, NON_CERT
    table.string('cert_number', 50).nullable();
    table.string('shape', 30).notNullable().defaultTo('ROUND'); // ROUND, PEAR, MARQUISE, PRINCESS, EMERALD, OVAL, CUSHION, RADIANT
    table.decimal('carat', 10, 4).notNullable();
    table.string('color', 10).notNullable(); // D, E, F, G, H, I, J, FANCY
    table.string('clarity', 15).notNullable(); // FL, IF, VVS1, VVS2, VS1, VS2, SI1, SI2, I1
    table.string('cut', 15).nullable(); // EXCELLENT, VERY_GOOD, GOOD, FAIR
    table.string('polish', 15).nullable();
    table.string('symmetry', 15).nullable();
    table.string('fluorescence', 20).nullable(); // NONE, FAINT, MEDIUM, STRONG
    table.string('lab_video_url', 500).nullable();
    table.string('status', 30).notNullable().defaultTo('IN_STOCK');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['cert_number', 'shape', 'carat', 'color', 'clarity', 'status']);
  });

  // 13. lot_breakdown_history
  await knex.schema.createTable('lot_breakdown_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('parent_lot_id').notNullable().references('id').inTable('diamond_lots').onDelete('CASCADE');
    table.uuid('child_lot_id').notNullable().references('id').inTable('diamond_lots').onDelete('CASCADE');
    table.decimal('carats_transferred', 12, 4).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 14. stock_audit_logs
  await knex.schema.createTable('stock_audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('item_type', 30).notNullable(); // LOT, SINGLE_DIAMOND
    table.uuid('item_id').notNullable();
    table.decimal('physical_carat_found', 12, 4).notNullable();
    table.decimal('system_carat', 12, 4).notNullable();
    table.uuid('checked_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('audit_date').defaultTo(knex.fn.now());
    table.string('remarks', 255).nullable();
  });

  // ====================================================
  // MODULE 4: MEMO / APPROVAL MANAGEMENT (Tables 15 - 17)
  // ====================================================

  // 15. memo_bills
  await knex.schema.createTable('memo_bills', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('memo_number', 50).unique().notNullable();
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('RESTRICT');
    table.uuid('broker_id').nullable().references('id').inTable('brokers').onDelete('SET NULL');
    table.string('memo_type', 30).notNullable(); // MEMO_GIVEN, MEMO_RECEIVED
    table.date('issue_date').notNullable();
    table.date('return_due_date').notNullable();
    table.string('status', 30).notNullable().defaultTo('OPEN'); // OPEN, PARTIAL_RETURN, CLOSED, CONVERTED_TO_SALE
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index(['memo_number', 'party_id', 'status', 'return_due_date']);
  });

  // 16. memo_items
  await knex.schema.createTable('memo_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('memo_id').notNullable().references('id').inTable('memo_bills').onDelete('CASCADE');
    table.uuid('lot_id').nullable().references('id').inTable('diamond_lots').onDelete('SET NULL');
    table.uuid('single_diamond_id').nullable().references('id').inTable('single_diamonds').onDelete('SET NULL');
    table.decimal('carat', 12, 4).notNullable();
    table.decimal('asking_price', 15, 2).notNullable();
    table.string('status', 30).notNullable().defaultTo('WITH_PARTY'); // WITH_PARTY, RETURNED, SOLD
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 17. memo_return_logs
  await knex.schema.createTable('memo_return_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('memo_item_id').notNullable().references('id').inTable('memo_items').onDelete('CASCADE');
    table.decimal('returned_carat', 12, 4).notNullable();
    table.uuid('received_by').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('returned_at').defaultTo(knex.fn.now());
    table.string('condition_notes', 255).nullable();
  });

  // ====================================================
  // MODULE 5: SALES, PURCHASES & DEALS (Tables 18 - 22)
  // ====================================================

  // 18. purchase_orders
  await knex.schema.createTable('purchase_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('seller_id').notNullable().references('id').inTable('parties').onDelete('RESTRICT');
    table.uuid('broker_id').nullable().references('id').inTable('brokers').onDelete('SET NULL');
    table.string('bill_number', 50).notNullable();
    table.decimal('total_amount', 15, 2).notNullable();
    table.integer('payment_terms_days').defaultTo(30);
    table.date('order_date').notNullable();
    table.string('status', 30).defaultTo('CONFIRMED');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['seller_id', 'bill_number', 'order_date']);
  });

  // 19. purchase_items
  await knex.schema.createTable('purchase_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('purchase_id').notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
    table.uuid('lot_id').nullable().references('id').inTable('diamond_lots').onDelete('SET NULL');
    table.uuid('single_diamond_id').nullable().references('id').inTable('single_diamonds').onDelete('SET NULL');
    table.decimal('carat', 12, 4).notNullable();
    table.decimal('rate_per_carat', 15, 2).notNullable();
    table.decimal('total_amount', 15, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 20. sales_orders
  await knex.schema.createTable('sales_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('buyer_id').notNullable().references('id').inTable('parties').onDelete('RESTRICT');
    table.uuid('broker_id').nullable().references('id').inTable('brokers').onDelete('SET NULL');
    table.string('invoice_number', 50).unique().notNullable();
    table.decimal('total_carat', 12, 4).notNullable();
    table.decimal('gross_amount', 15, 2).notNullable();
    table.decimal('discount_pct', 5, 2).defaultTo(0.00);
    table.decimal('net_amount', 15, 2).notNullable();
    table.date('payment_due_date').notNullable();
    table.string('deal_status', 30).notNullable().defaultTo('UNPAID'); // UNPAID, PARTIAL, SETTLED, CANCELLED
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['buyer_id', 'invoice_number', 'payment_due_date', 'deal_status']);
  });

  // 21. sales_items
  await knex.schema.createTable('sales_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sales_id').notNullable().references('id').inTable('sales_orders').onDelete('CASCADE');
    table.uuid('lot_id').nullable().references('id').inTable('diamond_lots').onDelete('SET NULL');
    table.uuid('single_diamond_id').nullable().references('id').inTable('single_diamonds').onDelete('SET NULL');
    table.decimal('carat', 12, 4).notNullable();
    table.decimal('rate_per_carat', 15, 2).notNullable();
    table.decimal('total_price', 15, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 22. brokerage_ledgers
  await knex.schema.createTable('brokerage_ledgers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('transaction_type', 30).notNullable(); // SALE, PURCHASE
    table.uuid('transaction_id').notNullable();
    table.uuid('broker_id').notNullable().references('id').inTable('brokers').onDelete('RESTRICT');
    table.decimal('commission_pct', 5, 2).notNullable();
    table.decimal('total_brokerage_amount', 15, 2).notNullable();
    table.string('payment_status', 30).notNullable().defaultTo('PENDING'); // PENDING, PAID
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ==========================================================
  // MODULE 6: PROCESSING & REPAIR WORKSHOPS (Tables 23 - 26)
  // ==========================================================

  // 23. processing_centers
  await knex.schema.createTable('processing_centers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('CASCADE');
    table.string('workshop_location', 255).notNullable(); // e.g. Surat, BKC, Dahisar
    table.string('contact_person', 100).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 24. repair_issue_slips
  await knex.schema.createTable('repair_issue_slips', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slip_number', 50).unique().notNullable();
    table.date('issue_date').notNullable();
    table.uuid('processor_party_id').notNullable().references('id').inTable('parties').onDelete('RESTRICT');
    table.string('status', 30).notNullable().defaultTo('IN_PROGRESS'); // IN_PROGRESS, COMPLETED, CANCELLED
    table.date('expected_return_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 25. repair_items
  await knex.schema.createTable('repair_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('slip_id').notNullable().references('id').inTable('repair_issue_slips').onDelete('CASCADE');
    table.uuid('lot_id').nullable().references('id').inTable('diamond_lots').onDelete('SET NULL');
    table.uuid('single_diamond_id').nullable().references('id').inTable('single_diamonds').onDelete('SET NULL');
    table.decimal('original_weight', 12, 4).notNullable();
    table.string('reason', 255).notNullable(); // CLEAVAGE, RE_POLISH, LASER_SAWING, REMOVE_INCLUSION
    table.string('status', 30).defaultTo('AT_WORKSHOP');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 26. repair_return_slips
  await knex.schema.createTable('repair_return_slips', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('repair_item_id').notNullable().references('id').inTable('repair_items').onDelete('CASCADE');
    table.decimal('returned_weight', 12, 4).notNullable();
    table.decimal('carat_loss', 12, 4).notNullable();
    table.decimal('processing_charge', 15, 2).notNullable().defaultTo(0.00);
    table.date('return_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // ====================================================
  // MODULE 7: ACCOUNTING, LEDGER & PAYMENTS (Tables 27 - 30)
  // ====================================================

  // 27. payment_receipts
  await knex.schema.createTable('payment_receipts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('RESTRICT');
    table.decimal('amount_received', 15, 2).notNullable();
    table.string('payment_mode', 30).notNullable(); // RTGS, NEFT, CHEQUE, CASH, UPI, ANGDIA
    table.string('reference_no', 100).nullable();
    table.date('payment_date').notNullable();
    table.string('notes', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['party_id', 'payment_date']);
  });

  // 28. payment_allocations
  await knex.schema.createTable('payment_allocations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('receipt_id').notNullable().references('id').inTable('payment_receipts').onDelete('CASCADE');
    table.uuid('sales_order_id').notNullable().references('id').inTable('sales_orders').onDelete('CASCADE');
    table.decimal('allocated_amount', 15, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['receipt_id', 'sales_order_id']);
  });

  // 29. supplier_payments
  await knex.schema.createTable('supplier_payments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('seller_id').notNullable().references('id').inTable('parties').onDelete('RESTRICT');
    table.decimal('amount_paid', 15, 2).notNullable();
    table.string('payment_mode', 30).notNullable();
    table.string('reference_no', 100).nullable();
    table.date('payment_date').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['seller_id', 'payment_date']);
  });

  // 30. party_ledgers (Double Entry Running Balance)
  await knex.schema.createTable('party_ledgers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('CASCADE');
    table.string('entry_type', 10).notNullable(); // DEBIT, CREDIT
    table.decimal('amount', 15, 2).notNullable();
    table.string('reference_type', 50).notNullable(); // SALES_INVOICE, PAYMENT_RECEIPT, PURCHASE_BILL, SUPPLIER_PAYMENT, BROKERAGE
    table.uuid('reference_id').notNullable();
    table.decimal('running_balance', 15, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['party_id', 'created_at']);
  });

  // =========================================================
  // MODULE 8: FOLLOW-UPS & REMINDERS ENGINE (Tables 31 - 33)
  // =========================================================

  // 31. payment_schedules
  await knex.schema.createTable('payment_schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('sales_order_id').notNullable().references('id').inTable('sales_orders').onDelete('CASCADE');
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('CASCADE');
    table.date('due_date').notNullable();
    table.date('promised_date').nullable();
    table.decimal('amount_due', 15, 2).notNullable();
    table.string('status', 30).notNullable().defaultTo('PENDING'); // PENDING, OVERDUE, PAID, PROMISED
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['party_id', 'due_date', 'status']);
  });

  // 32. follow_up_logs
  await knex.schema.createTable('follow_up_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('CASCADE');
    table.date('call_date').notNullable();
    table.uuid('caller_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('client_response').notNullable();
    table.date('next_follow_up_date').nullable();
    table.string('audio_note_url', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['party_id', 'call_date']);
  });

  // 33. daily_reminders
  await knex.schema.createTable('daily_reminders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('target_user_id').nullable().references('id').inTable('users').onDelete('CASCADE');
    table.date('scheduled_date').notNullable();
    table.text('message').notNullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.boolean('pushed_to_kafka').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['target_user_id', 'scheduled_date', 'is_read']);
  });

  // ==============================================================
  // MODULE 9: NOTIFICATION QUEUES & WHATSAPP (Tables 34 - 35)
  // ==============================================================

  // 34. notification_queues
  await knex.schema.createTable('notification_queues', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('party_id').notNullable().references('id').inTable('parties').onDelete('CASCADE');
    table.string('channel', 20).notNullable(); // PUSH, SMS, WHATSAPP
    table.jsonb('payload').notNullable();
    table.string('status', 20).notNullable().defaultTo('QUEUED'); // QUEUED, SENT, FAILED
    table.integer('retry_count').defaultTo(0);
    table.timestamp('scheduled_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['status', 'channel', 'scheduled_at']);
  });

  // 35. whatsapp_templates
  await knex.schema.createTable('whatsapp_templates', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('template_name', 100).unique().notNullable(); // e.g. OVERDUE_PAYMENT_ALERT, MEMO_RETURN_REMINDER
    table.text('message_body').notNullable();
    table.jsonb('parameters_json').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // =====================================================
  // MODULE 10: SYSTEM AUDIT LOGS (Tables 36 - 37)
  // =====================================================

  // 36. system_audit_logs
  await knex.schema.createTable('system_audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 50).notNullable(); // INSERT, UPDATE, DELETE, MEMO_DISPATCH, PAYMENT_RECON
    table.string('table_name', 100).notNullable();
    table.string('record_id', 100).notNullable();
    table.jsonb('old_value_json').nullable();
    table.jsonb('new_value_json').nullable();
    table.string('ip_address', 50).nullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.index(['table_name', 'record_id', 'timestamp']);
  });

  // 37. report_schedules
  await knex.schema.createTable('report_schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('report_type', 50).notNullable(); // DAILY_OUTSTANDING_DEBTORS, STOCK_VALUATION, MEMO_PENDING_REPORT
    table.string('recipient_phone', 20).notNullable();
    table.string('cron_expression', 50).notNullable().defaultTo('0 9 * * *'); // Daily 9am Mumbai IST
    table.timestamp('last_run_at').nullable();
    table.string('status', 20).defaultTo('ACTIVE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop tables in reverse dependency order
  await knex.schema.dropTableIfExists('report_schedules');
  await knex.schema.dropTableIfExists('system_audit_logs');
  await knex.schema.dropTableIfExists('whatsapp_templates');
  await knex.schema.dropTableIfExists('notification_queues');
  await knex.schema.dropTableIfExists('daily_reminders');
  await knex.schema.dropTableIfExists('follow_up_logs');
  await knex.schema.dropTableIfExists('payment_schedules');
  await knex.schema.dropTableIfExists('party_ledgers');
  await knex.schema.dropTableIfExists('supplier_payments');
  await knex.schema.dropTableIfExists('payment_allocations');
  await knex.schema.dropTableIfExists('payment_receipts');
  await knex.schema.dropTableIfExists('repair_return_slips');
  await knex.schema.dropTableIfExists('repair_items');
  await knex.schema.dropTableIfExists('repair_issue_slips');
  await knex.schema.dropTableIfExists('processing_centers');
  await knex.schema.dropTableIfExists('brokerage_ledgers');
  await knex.schema.dropTableIfExists('sales_items');
  await knex.schema.dropTableIfExists('sales_orders');
  await knex.schema.dropTableIfExists('purchase_items');
  await knex.schema.dropTableIfExists('purchase_orders');
  await knex.schema.dropTableIfExists('memo_return_logs');
  await knex.schema.dropTableIfExists('memo_items');
  await knex.schema.dropTableIfExists('memo_bills');
  await knex.schema.dropTableIfExists('stock_audit_logs');
  await knex.schema.dropTableIfExists('lot_breakdown_history');
  await knex.schema.dropTableIfExists('single_diamonds');
  await knex.schema.dropTableIfExists('diamond_lots');
  await knex.schema.dropTableIfExists('diamond_categories');
  await knex.schema.dropTableIfExists('brokers');
  await knex.schema.dropTableIfExists('party_bank_details');
  await knex.schema.dropTableIfExists('party_addresses');
  await knex.schema.dropTableIfExists('parties');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
}
