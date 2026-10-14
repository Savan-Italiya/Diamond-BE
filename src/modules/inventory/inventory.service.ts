import { db } from '../../database/connection';
import { redisService } from '../../config/redis';
import { AppError } from '../../middleware/error.middleware';
import { kafkaService, KafkaTopics } from '../../config/kafka';

const CACHE_KEY_STOCK_SUMMARY = 'diamond:inventory:stock_summary';

export class InventoryService {
  public static async getLots(filters?: { status?: string; search?: string }) {
    let query = db('diamond_lots')
      .leftJoin('diamond_categories', 'diamond_lots.category_id', 'diamond_categories.id')
      .select(
        'diamond_lots.*',
        'diamond_categories.category_name'
      );

    if (filters?.status) {
      query = query.where('diamond_lots.status', filters.status);
    }

    if (filters?.search) {
      query = query.whereILike('diamond_lots.lot_number', `%${filters.search}%`);
    }

    return await query.orderBy('diamond_lots.created_at', 'desc');
  }

  public static async getSingleDiamonds(filters?: {
    cert_type?: string;
    shape?: string;
    color?: string;
    clarity?: string;
    min_carat?: number;
    max_carat?: number;
    status?: string;
  }) {
    let query = db('single_diamonds').select('*');

    if (filters?.cert_type) query = query.where('cert_type', filters.cert_type);
    if (filters?.shape) query = query.where('shape', filters.shape);
    if (filters?.color) query = query.where('color', filters.color);
    if (filters?.clarity) query = query.where('clarity', filters.clarity);
    if (filters?.status) query = query.where('status', filters.status);
    if (filters?.min_carat) query = query.where('carat', '>=', filters.min_carat);
    if (filters?.max_carat) query = query.where('carat', '<=', filters.max_carat);

    return await query.orderBy('carat', 'desc');
  }

  public static async createLot(data: {
    lot_number: string;
    category_id?: string;
    total_carat: number;
    cost_per_carat: number;
    purchase_date: string;
  }) {
    const existing = await db('diamond_lots').where({ lot_number: data.lot_number }).first();
    if (existing) {
      throw new AppError(`Lot with number ${data.lot_number} already exists`, 409, 'LOT_EXISTS');
    }

    const [newLot] = await db('diamond_lots')
      .insert({
        lot_number: data.lot_number,
        category_id: data.category_id || null,
        total_carat: data.total_carat,
        current_carat: data.total_carat,
        cost_per_carat: data.cost_per_carat,
        purchase_date: data.purchase_date,
        status: 'IN_STOCK'
      })
      .returning('*');

    await redisService.del(CACHE_KEY_STOCK_SUMMARY);
    await kafkaService.emit(KafkaTopics.STOCK_STATUS_CHANGED, {
      lot_id: newLot.id,
      lot_number: newLot.lot_number,
      status: 'IN_STOCK',
      carat: newLot.current_carat
    });

    return newLot;
  }

  public static async createSingleDiamond(data: any) {
    const [diamond] = await db('single_diamonds')
      .insert({
        ...data,
        status: 'IN_STOCK'
      })
      .returning('*');

    await redisService.del(CACHE_KEY_STOCK_SUMMARY);
    return diamond;
  }

  public static async breakdownLot(
    parentLotId: string,
    newLotNumber: string,
    caratsTransferred: number,
    costPerCarat?: number
  ) {
    return await db.transaction(async (trx) => {
      const parentLot = await trx('diamond_lots').where({ id: parentLotId }).forUpdate().first();
      if (!parentLot) {
        throw new AppError('Parent lot not found', 404, 'NOT_FOUND');
      }

      if (Number(parentLot.current_carat) < caratsTransferred) {
        throw new AppError(
          `Insufficient carats in lot. Available: ${parentLot.current_carat}, Requested: ${caratsTransferred}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      const updatedParentCarat = Number(parentLot.current_carat) - caratsTransferred;
      await trx('diamond_lots')
        .where({ id: parentLotId })
        .update({
          current_carat: updatedParentCarat,
          status: updatedParentCarat === 0 ? 'SOLD' : parentLot.status,
          updated_at: trx.fn.now()
        });

      const effectiveCost = costPerCarat || parentLot.cost_per_carat;

      const [childLot] = await trx('diamond_lots')
        .insert({
          lot_number: newLotNumber,
          category_id: parentLot.category_id,
          total_carat: caratsTransferred,
          current_carat: caratsTransferred,
          cost_per_carat: effectiveCost,
          purchase_date: parentLot.purchase_date,
          status: 'IN_STOCK'
        })
        .returning('*');

      await trx('lot_breakdown_history').insert({
        parent_lot_id: parentLotId,
        child_lot_id: childLot.id,
        carats_transferred: caratsTransferred
      });

      await redisService.del(CACHE_KEY_STOCK_SUMMARY);
      return { parentLotUpdatedCarat: updatedParentCarat, childLot };
    });
  }

  public static async recordStockAudit(data: {
    item_type: 'LOT' | 'SINGLE_DIAMOND';
    item_id: string;
    physical_carat_found: number;
    checked_by?: string;
    remarks?: string;
  }) {
    let systemCarat = 0;
    if (data.item_type === 'LOT') {
      const lot = await db('diamond_lots').where({ id: data.item_id }).first();
      if (!lot) throw new AppError('Lot not found', 404, 'NOT_FOUND');
      systemCarat = Number(lot.current_carat);
    } else {
      const diamond = await db('single_diamonds').where({ id: data.item_id }).first();
      if (!diamond) throw new AppError('Diamond not found', 404, 'NOT_FOUND');
      systemCarat = Number(diamond.carat);
    }

    const [auditLog] = await db('stock_audit_logs')
      .insert({
        item_type: data.item_type,
        item_id: data.item_id,
        physical_carat_found: data.physical_carat_found,
        system_carat: systemCarat,
        checked_by: data.checked_by || null,
        remarks: data.remarks || null
      })
      .returning('*');

    return {
      ...auditLog,
      discrepancy: data.physical_carat_found - systemCarat
    };
  }

  public static async getStockSummary() {
    const cached = await redisService.get(CACHE_KEY_STOCK_SUMMARY);
    if (cached) {
      return JSON.parse(cached);
    }

    const lotStats: any = await db('diamond_lots')
      .where('status', 'IN_STOCK')
      .sum({ total_carat: 'current_carat' })
      .select(
        db.raw('SUM(current_carat * cost_per_carat) as total_valuation'),
        db.raw('COUNT(id) as total_lots')
      )
      .first();

    const singleStats: any = await db('single_diamonds')
      .where('status', 'IN_STOCK')
      .sum({ total_carat: 'carat' })
      .count({ total_solitaires: 'id' })
      .first();

    const summary = {
      lots: {
        total_lots: Number(lotStats?.total_lots || 0),
        total_carats: Number(lotStats?.total_carat || 0),
        total_valuation_inr: Number(lotStats?.total_valuation || 0)
      },
      solitaires: {
        total_solitaires: Number(singleStats?.total_solitaires || 0),
        total_carats: Number(singleStats?.total_carat || 0)
      },
      aggregated_carats:
        Number(lotStats?.total_carat || 0) + Number(singleStats?.total_carat || 0),
      timestamp: new Date().toISOString()
    };

    // Cache in Redis for 10 minutes
    await redisService.set(CACHE_KEY_STOCK_SUMMARY, JSON.stringify(summary), 600);

    return summary;
  }
}
