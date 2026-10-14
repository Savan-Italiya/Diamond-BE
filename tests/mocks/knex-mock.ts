export function createMockKnex() {
  const chain: any = {
    where: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereILike: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orWhereILike: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    first: jest.fn(),
    returning: jest.fn().mockReturnThis(),
    forUpdate: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    distinctOn: jest.fn().mockReturnThis()
  };

  const fn: any = jest.fn(() => chain);
  fn.raw = jest.fn((str) => str);
  fn.fn = { now: jest.fn(() => '2026-10-14T12:00:00Z') };
  fn.transaction = jest.fn(async (cb: (trx: any) => Promise<any>) => {
    return await cb(fn);
  });

  return { fn, chain };
}
