import { db } from '../../database/connection';

export interface ExpenseDTO {
  category: string;
  description: string;
  amount: number;
  paid_to?: string;
  payment_mode?: string;
  expense_date?: string;
  receipt_url?: string;
  user_id?: string;
  organization_id?: string;
}

export class ExpensesService {
  public static async getExpenses(filters: {
    user_id?: string;
    organization_id?: string;
    from_date?: string;
    to_date?: string;
    category?: string;
  }) {
    let q = db('expenses').orderBy('expense_date', 'desc');

    if (filters.from_date) q = q.where('expense_date', '>=', filters.from_date);
    if (filters.to_date)   q = q.where('expense_date', '<=', filters.to_date);
    if (filters.category)  q = q.where({ category: filters.category });
    if (filters.user_id)   q = q.where({ user_id: filters.user_id });

    return q;
  }

  public static async createExpense(data: ExpenseDTO) {
    const [row] = await db('expenses')
      .insert({
        category:        data.category,
        description:     data.description,
        amount:          data.amount,
        paid_to:         data.paid_to || null,
        payment_mode:    data.payment_mode || 'CASH',
        expense_date:    data.expense_date || new Date().toISOString().split('T')[0],
        receipt_url:     data.receipt_url || null,
        user_id:         data.user_id || null,
        organization_id: data.organization_id || null,
        created_at:      new Date()
      })
      .returning('*');
    return row;
  }

  public static async deleteExpense(id: string, userId?: string) {
    const q = db('expenses').where({ id });
    if (userId) q.where({ user_id: userId });
    const deleted = await q.delete();
    return deleted > 0;
  }

  public static async getSummary(filters: {
    user_id?: string;
    from_date?: string;
    to_date?: string;
  }) {
    let q = db('expenses');
    if (filters.from_date) q = q.where('expense_date', '>=', filters.from_date);
    if (filters.to_date)   q = q.where('expense_date', '<=', filters.to_date);
    if (filters.user_id)   q = q.where({ user_id: filters.user_id });

    const rows = await q.select('category').sum('amount as total').groupBy('category');
    const grandTotal = rows.reduce((s: number, r: any) => s + Number(r.total), 0);
    return { by_category: rows, grand_total: grandTotal };
  }
}
