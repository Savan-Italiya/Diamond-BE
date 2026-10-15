import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // -------------------------------------------------------------
  // 1. Safe teardown: Handle foreign key constraints cleanly
  // -------------------------------------------------------------
  // Nullify circular references between organizations and users
  if (await knex.schema.hasColumn('users', 'organization_id')) {
    await knex('users').update({ organization_id: null });
  }
  if (await knex.schema.hasColumn('organizations', 'owner_user_id')) {
    await knex('organizations').update({ owner_user_id: null });
  }

  // Delete child/dependent tables in reverse order
  const tablesToClear = [
    'expenses',
    'sms_notification_logs',
    'follow_up_logs',
    'daily_reminders',
    'notification_queues',
    'sales_items',
    'brokerage_ledgers',
    'sales_orders',
    'single_diamonds',
    'diamond_lots',
    'diamond_categories',
    'brokers',
    'party_addresses',
    'parties',
    'whatsapp_templates',
    'user_roles',
    'role_permissions',
    'roles',
    'users',
    'organizations'
  ];

  for (const table of tablesToClear) {
    if (await knex.schema.hasTable(table)) {
      await knex(table).del();
    }
  }

  const passwordHash = await bcrypt.hash('Admin@Mumbai2026', 10);

  // -------------------------------------------------------------
  // 2. Roles
  // -------------------------------------------------------------
  const roles = await knex('roles')
    .insert([
      { role_name: 'SUPER_ADMIN', description: 'Full system administrative access' },
      { role_name: 'DIAMOND_TRADER', description: 'Inventory, Memo, and Sales desk trader' },
      { role_name: 'ACCOUNTANT', description: 'Ledgers, Khata, Expenses, and Payment receipts' },
      { role_name: 'BROKER', description: 'External broker portal view' }
    ])
    .returning('*');

  const adminRole = roles.find((r) => r.role_name === 'SUPER_ADMIN')!;
  const traderRole = roles.find((r) => r.role_name === 'DIAMOND_TRADER')!;
  const accountantRole = roles.find((r) => r.role_name === 'ACCOUNTANT')!;

  // -------------------------------------------------------------
  // 3. Organizations (Multi-Tenancy)
  // -------------------------------------------------------------
  const [bkcOrg, operaOrg] = await knex('organizations')
    .insert([
      {
        name: 'BKC Solitaire Diamonds Pvt Ltd',
        slug: 'bkc-solitaire',
        registration_number: 'BDB-TOWER-C-501-GST27',
        phone: '+919820011223',
        email: 'info@bkc-diamonds.com',
        city: 'Mumbai',
        address: 'Tower-C, 5th Floor, Suite 501, Bharat Diamond Bourse, BKC, Bandra East, Mumbai - 400051'
      },
      {
        name: 'Opera House Gems & Jewels LLP',
        slug: 'opera-house-gems',
        registration_number: 'OH-PAN-102-GST27',
        phone: '+919833344455',
        email: 'contact@operahousegems.com',
        city: 'Mumbai',
        address: 'Shop 102, Ground Floor, Panchratna Building, Opera House, Charni Road, Mumbai - 400004'
      }
    ])
    .returning('*');

  // -------------------------------------------------------------
  // 4. Users linked to Organizations (Multi-User with Scopes)
  // -------------------------------------------------------------
  const users = await knex('users')
    .insert([
      // BKC HQ - Head / Super Admin (GLOBAL Scope)
      {
        name: 'Pravinbhai Shah (BKC Head)',
        phone: '+919820011223',
        email: 'admin@bkc-diamonds.com',
        password_hash: passwordHash,
        status: 'ACTIVE',
        organization_id: bkcOrg.id,
        user_scope: 'GLOBAL'
      },
      // BKC HQ - Senior Trader (INDIVIDUAL Scope - manages own deals & inventory)
      {
        name: 'Rajesh Mehta (Senior Trader)',
        phone: '+919820199887',
        email: 'rajesh@bkc-diamonds.com',
        password_hash: passwordHash,
        status: 'ACTIVE',
        organization_id: bkcOrg.id,
        user_scope: 'INDIVIDUAL'
      },
      // BKC HQ - Chief Accountant (GLOBAL Scope - audits all firm expenses & ledgers)
      {
        name: 'Ketan Parikh (Chief Accountant)',
        phone: '+919820233445',
        email: 'accountant@bkc-diamonds.com',
        password_hash: passwordHash,
        status: 'ACTIVE',
        organization_id: bkcOrg.id,
        user_scope: 'GLOBAL'
      },
      // Opera House Branch - Partner / Admin (GLOBAL Scope within Org 2)
      {
        name: 'Sureshbhai Zaveri (Opera House Partner)',
        phone: '+919833355667',
        email: 'admin@operahousegems.com',
        password_hash: passwordHash,
        status: 'ACTIVE',
        organization_id: operaOrg.id,
        user_scope: 'GLOBAL'
      }
    ])
    .returning('*');

  const bkcAdmin = users[0];
  const bkcTrader = users[1];
  const bkcAccountant = users[2];
  const operaAdmin = users[3];

  // Set owner_user_id for organizations
  await knex('organizations')
    .where({ id: bkcOrg.id })
    .update({ owner_user_id: bkcAdmin.id });

  await knex('organizations')
    .where({ id: operaOrg.id })
    .update({ owner_user_id: operaAdmin.id });

  // Map user roles
  await knex('user_roles').insert([
    { user_id: bkcAdmin.id, role_id: adminRole.id },
    { user_id: bkcTrader.id, role_id: traderRole.id },
    { user_id: bkcAccountant.id, role_id: accountantRole.id },
    { user_id: operaAdmin.id, role_id: adminRole.id }
  ]);

  // -------------------------------------------------------------
  // 5. Diamond Categories
  // -------------------------------------------------------------
  const categories = await knex('diamond_categories')
    .insert([
      { category_name: 'SOLITAIRE', description: 'Certified Single Diamonds (GIA, IGI, HRD)' },
      { category_name: 'PARCEL_LOT', description: 'Bulk Melee / Parcha / Calibrated Lots' },
      { category_name: 'ROUGH', description: 'Uncut rough diamonds directly from Antwerp/Africa' },
      { category_name: 'POLISHED', description: 'Polished commercial lots' }
    ])
    .returning('*');

  const solitaireCat = categories.find((c) => c.category_name === 'SOLITAIRE');
  const parcelCat = categories.find((c) => c.category_name === 'PARCEL_LOT');
  const roughCat = categories.find((c) => c.category_name === 'ROUGH');

  // -------------------------------------------------------------
  // 6. Parties (Buyers, Brokers in BDB / Opera House)
  // -------------------------------------------------------------
  const parties = await knex('parties')
    .insert([
      {
        business_name: 'Mahavir Gems & Jewels',
        owner_name: 'Bipinbhai Mehta',
        phone_primary: '+919820123456',
        phone_secondary: '+912223671122',
        gstin: '27AABCM1234F1Z1',
        pan: 'AABCM1234F',
        party_type: 'BUYER',
        credit_limit: 25000000.00
      },
      {
        business_name: 'Navkar Diamond Impex',
        owner_name: 'Jayeshbhai Sanghavi',
        phone_primary: '+919820988776',
        gstin: '27AABCN5678K1Z3',
        pan: 'AABCN5678K',
        party_type: 'BUYER',
        credit_limit: 15000000.00
      },
      {
        business_name: 'Surat Diamond Craft LLP',
        owner_name: 'Hiteshbhai Patel',
        phone_primary: '+919825123999',
        gstin: '24AACCS9012D1Z8',
        pan: 'AACCS9012D',
        party_type: 'BUYER',
        credit_limit: 30000000.00
      },
      {
        business_name: 'Kothari Broking House',
        owner_name: 'Hiteshbhai Kothari',
        phone_primary: '+919820987654',
        gstin: '27AAACK5678B1Z5',
        pan: 'AAACK5678B',
        party_type: 'BROKER',
        credit_limit: 10000000.00
      }
    ])
    .returning('*');

  const buyerMahavir = parties[0];
  const buyerNavkar = parties[1];
  const buyerSurat = parties[2];
  const brokerParty = parties[3];

  await knex('party_addresses').insert([
    {
      party_id: buyerMahavir.id,
      address_line: 'Tower-C, 5th Floor, Bharat Diamond Bourse, Bandra Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051'
    },
    {
      party_id: buyerNavkar.id,
      address_line: 'Panchratna Building, Opera House, Charni Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400004'
    },
    {
      party_id: buyerSurat.id,
      address_line: 'Katargam Diamond Park, Varachha Road',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395004'
    }
  ]);

  const [broker] = await knex('brokers')
    .insert({
      party_id: brokerParty.id,
      default_commission_rate: 1.00
    })
    .returning('*');

  // -------------------------------------------------------------
  // 7. Diamond Lots (Linked to Organization & Created By)
  // -------------------------------------------------------------
  const lots = await knex('diamond_lots')
    .insert([
      {
        lot_number: 'LOT-BKC-2026-001',
        category_id: parcelCat?.id,
        total_carat: 125.5000,
        current_carat: 125.5000,
        cost_per_carat: 28500.00,
        purchase_date: '2026-09-15',
        status: 'IN_STOCK',
        organization_id: bkcOrg.id,
        created_by_user_id: bkcTrader.id
      },
      {
        lot_number: 'LOT-BKC-2026-002',
        category_id: solitaireCat?.id,
        total_carat: 3.5200,
        current_carat: 3.5200,
        cost_per_carat: 450000.00,
        purchase_date: '2026-10-01',
        status: 'IN_STOCK',
        organization_id: bkcOrg.id,
        created_by_user_id: bkcAdmin.id
      },
      {
        lot_number: 'LOT-OPH-2026-101',
        category_id: roughCat?.id,
        total_carat: 80.0000,
        current_carat: 80.0000,
        cost_per_carat: 32000.00,
        purchase_date: '2026-10-05',
        status: 'IN_STOCK',
        organization_id: operaOrg.id,
        created_by_user_id: operaAdmin.id
      }
    ])
    .returning('*');

  const bkcParcelLot = lots[0];
  const bkcSolitaireLot = lots[1];

  // -------------------------------------------------------------
  // 8. Single Diamonds (GIA Certified)
  // -------------------------------------------------------------
  await knex('single_diamonds').insert([
    {
      lot_id: bkcSolitaireLot.id,
      cert_type: 'GIA',
      cert_number: '2234567891',
      shape: 'ROUND',
      carat: 1.5100,
      color: 'D',
      clarity: 'VVS1',
      cut: 'EXCELLENT',
      polish: 'EXCELLENT',
      symmetry: 'EXCELLENT',
      fluorescence: 'NONE',
      lab_video_url: 'https://video.diamond-cert.com/2234567891.mp4',
      status: 'IN_STOCK'
    },
    {
      lot_id: bkcSolitaireLot.id,
      cert_type: 'GIA',
      cert_number: '5567891234',
      shape: 'OVAL',
      carat: 2.0100,
      color: 'E',
      clarity: 'VS1',
      cut: 'EXCELLENT',
      polish: 'EXCELLENT',
      symmetry: 'VERY_GOOD',
      fluorescence: 'FAINT',
      lab_video_url: 'https://video.diamond-cert.com/5567891234.mp4',
      status: 'IN_STOCK'
    }
  ]);

  // -------------------------------------------------------------
  // 9. Sales Orders & Items (With Organization & Creator)
  // -------------------------------------------------------------
  const today = new Date();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);

  const fiveDaysLater = new Date(today);
  fiveDaysLater.setDate(today.getDate() + 5);

  const salesOrders = await knex('sales_orders')
    .insert([
      {
        buyer_id: buyerMahavir.id,
        broker_id: broker.id,
        invoice_number: 'INV-BKC-2026-001',
        total_carat: 50.0000,
        gross_amount: 1500000.00,
        discount_pct: 0.00,
        net_amount: 1500000.00,
        payment_due_date: threeDaysAgo.toISOString().split('T')[0],
        deal_status: 'UNPAID',
        organization_id: bkcOrg.id,
        created_by_user_id: bkcTrader.id
      },
      {
        buyer_id: buyerNavkar.id,
        broker_id: null,
        invoice_number: 'INV-BKC-2026-002',
        total_carat: 28.5000,
        gross_amount: 850000.00,
        discount_pct: 0.00,
        net_amount: 850000.00,
        payment_due_date: today.toISOString().split('T')[0],
        deal_status: 'PARTIAL',
        organization_id: bkcOrg.id,
        created_by_user_id: bkcTrader.id
      },
      {
        buyer_id: buyerSurat.id,
        broker_id: broker.id,
        invoice_number: 'INV-BKC-2026-003',
        total_carat: 65.0000,
        gross_amount: 2200000.00,
        discount_pct: 0.00,
        net_amount: 2200000.00,
        payment_due_date: fiveDaysLater.toISOString().split('T')[0],
        deal_status: 'UNPAID',
        organization_id: bkcOrg.id,
        created_by_user_id: bkcAdmin.id
      }
    ])
    .returning('*');

  // Sales Items for first order
  await knex('sales_items').insert([
    {
      sales_id: salesOrders[0].id,
      lot_id: bkcParcelLot.id,
      carat: 50.0000,
      rate_per_carat: 30000.00,
      total_price: 1500000.00
    },
    {
      sales_id: salesOrders[1].id,
      lot_id: bkcParcelLot.id,
      carat: 28.5000,
      rate_per_carat: 29824.56,
      total_price: 850000.00
    }
  ]);

  // -------------------------------------------------------------
  // 10. Expenses (Kharcha) linked to Organization & Users
  // -------------------------------------------------------------
  await knex('expenses').insert([
    {
      category: 'OFFICE',
      description: 'Tower-C BDB Maintenance & Gala Office Rent',
      amount: 85000.00,
      paid_to: 'Bharat Diamond Bourse Society',
      payment_mode: 'NEFT',
      expense_date: today.toISOString().split('T')[0],
      organization_id: bkcOrg.id,
      user_id: bkcAccountant.id
    },
    {
      category: 'TRAVEL',
      description: 'Brinks Armored Transit & GIA Certification Logistics',
      amount: 24500.00,
      paid_to: 'Brinks Armored Logistics BKC',
      payment_mode: 'NEFT',
      expense_date: today.toISOString().split('T')[0],
      organization_id: bkcOrg.id,
      user_id: bkcTrader.id
    },
    {
      category: 'OFFICE',
      description: 'Client High-Tea & BDB Trading Hall Refreshments',
      amount: 3850.00,
      paid_to: 'BDB Food Court & Refreshments',
      payment_mode: 'CASH',
      expense_date: today.toISOString().split('T')[0],
      organization_id: bkcOrg.id,
      user_id: bkcTrader.id
    },
    {
      category: 'COMM',
      description: 'High-speed Leased Line & Trader Mobile Plans',
      amount: 6200.00,
      paid_to: 'Tata Teleservices Enterprise BKC',
      payment_mode: 'UPI',
      expense_date: today.toISOString().split('T')[0],
      organization_id: bkcOrg.id,
      user_id: bkcAccountant.id
    }
  ]);

  // -------------------------------------------------------------
  // 11. Follow-up Logs (Call status, timeline & notes)
  // -------------------------------------------------------------
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  await knex('follow_up_logs').insert([
    {
      party_id: buyerMahavir.id,
      call_date: today.toISOString().split('T')[0],
      caller_user_id: bkcTrader.id,
      call_status: 'PROMISED',
      client_response: 'Spoke with Bipinbhai. Promised to clear Rs 5,00,000 by 3 PM tomorrow via RTGS. Balance Rs 10,00,000 by Friday.',
      next_follow_up_date: tomorrow.toISOString().split('T')[0]
    },
    {
      party_id: buyerNavkar.id,
      call_date: today.toISOString().split('T')[0],
      caller_user_id: bkcTrader.id,
      call_status: 'RESCHEDULED',
      client_response: 'Jayeshbhai was in trading hall negotiation. Requested callback after 5:30 PM today.',
      next_follow_up_date: today.toISOString().split('T')[0]
    }
  ]);

  // -------------------------------------------------------------
  // 12. SMS Notification Logs
  // -------------------------------------------------------------
  await knex('sms_notification_logs').insert([
    {
      party_id: buyerMahavir.id,
      phone: '+919820123456',
      message_body: 'BKC Solitaires: Payment reminder for invoice INV-BKC-2026-001 of Rs. 15,00,000 overdue by 3 days. Kindly arrange payment via RTGS.',
      status: 'SENT',
      provider: 'DLT_SMS_GATEWAY',
      reference_type: 'PAYMENT_OVERDUE',
      reference_id: 'INV-BKC-2026-001'
    }
  ]);

  // -------------------------------------------------------------
  // 13. WhatsApp Templates
  // -------------------------------------------------------------
  await knex('whatsapp_templates').insert([
    {
      template_name: 'PAYMENT_DUE_ALERT',
      message_body: 'Respected {{party_name}}, this is a gentle reminder from BKC Diamond Trading regarding invoice #{{invoice_number}} of Rs. {{amount}} due on {{due_date}}. Please arrange payment via RTGS/NEFT. Thank you.',
      parameters_json: JSON.stringify(['party_name', 'invoice_number', 'amount', 'due_date'])
    },
    {
      template_name: 'MEMO_RETURN_REMINDER',
      message_body: 'Pranam {{party_name}}, Memo Challan #{{memo_number}} for {{carat}} Cts issued on {{issue_date}} is due for return today. Kindly update status or return the packet. Regards.',
      parameters_json: JSON.stringify(['party_name', 'memo_number', 'carat', 'issue_date'])
    },
    {
      template_name: 'BROKER_COMMISSION_VOUCHER',
      message_body: 'Pranam {{broker_name}}, your brokerage voucher for deal #{{invoice_number}} has been credited. Amount: Rs. {{commission_amount}}. Thank you.',
      parameters_json: JSON.stringify(['broker_name', 'invoice_number', 'commission_amount'])
    }
  ]);
}
