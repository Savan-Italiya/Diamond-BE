import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing records in reverse dependency order
  await knex('whatsapp_templates').del();
  await knex('single_diamonds').del();
  await knex('diamond_lots').del();
  await knex('diamond_categories').del();
  await knex('brokers').del();
  await knex('party_addresses').del();
  await knex('parties').del();
  await knex('user_roles').del();
  await knex('roles').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('Admin@Mumbai2026', 10);

  // 1. Roles
  const [adminRole] = await knex('roles')
    .insert([
      { role_name: 'SUPER_ADMIN', description: 'Full system administrative access' },
      { role_name: 'DIAMOND_TRADER', description: 'Inventory, Memo, and Sales desk trader' },
      { role_name: 'ACCOUNTANT', description: 'Ledgers, Khata, and Payment receipts management' },
      { role_name: 'BROKER', description: 'External broker portal limited view' }
    ])
    .returning('*');

  // 2. Admin User
  const [adminUser] = await knex('users')
    .insert({
      name: 'Pravinbhai Shah (BKC Head)',
      phone: '+919820011223',
      email: 'admin@bkc-diamonds.com',
      password_hash: passwordHash,
      status: 'ACTIVE'
    })
    .returning('*');

  // 3. User Role mapping
  await knex('user_roles').insert({
    user_id: adminUser.id,
    role_id: adminRole.id
  });

  // 4. Diamond Categories
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

  // 5. Parties (Buyers, Sellers, Brokers, Processors in Opera House / BKC)
  const [buyer1] = await knex('parties')
    .insert({
      business_name: 'Mahavir Gems & Jewels',
      owner_name: 'Bipinbhai Mehta',
      phone_primary: '+919820123456',
      phone_secondary: '+912223671122',
      gstin: '27AABCM1234F1Z1',
      pan: 'AABCM1234F',
      party_type: 'BUYER',
      credit_limit: 25000000.00
    })
    .returning('*');

  await knex('party_addresses').insert({
    party_id: buyer1.id,
    address_line: 'Tower-C, 5th Floor, Bharat Diamond Bourse, Bandra Kurla Complex',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051'
  });

  const [brokerParty] = await knex('parties')
    .insert({
      business_name: 'Kothari Broking House',
      owner_name: 'Hiteshbhai Kothari',
      phone_primary: '+919820987654',
      gstin: '27AAACK5678B1Z5',
      pan: 'AAACK5678B',
      party_type: 'BROKER',
      credit_limit: 10000000.00
    })
    .returning('*');

  const [broker] = await knex('brokers')
    .insert({
      party_id: brokerParty.id,
      default_commission_rate: 1.00
    })
    .returning('*');

  // 6. Diamond Lots
  const [lot1] = await knex('diamond_lots')
    .insert({
      lot_number: 'LOT-BKC-2026-001',
      category_id: parcelCat?.id,
      total_carat: 125.5000,
      current_carat: 125.5000,
      cost_per_carat: 28500.00,
      purchase_date: '2026-09-15',
      status: 'IN_STOCK'
    })
    .returning('*');

  const [lot2] = await knex('diamond_lots')
    .insert({
      lot_number: 'LOT-BKC-2026-002',
      category_id: solitaireCat?.id,
      total_carat: 3.5200,
      current_carat: 3.5200,
      cost_per_carat: 450000.00,
      purchase_date: '2026-10-01',
      status: 'IN_STOCK'
    })
    .returning('*');

  // 7. Single Diamonds (GIA Certified)
  await knex('single_diamonds').insert([
    {
      lot_id: lot2.id,
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
      lot_id: lot2.id,
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

  // 8. WhatsApp Templates
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
    }
  ]);
}
