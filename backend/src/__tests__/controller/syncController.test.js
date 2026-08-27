import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncData, pullUpdates } from '../../controller/syncController.js';
import { prisma } from '../../config/db.js';

// Mock Prisma
vi.mock('../../config/db.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    category: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    budget: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    goal: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    subscription: {
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

describe('syncController', () => {
  let req;
  let res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      user: { userId: 'user-id-test-123' },
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('syncData', () => {
    it('should return 400 if mutations is not an array', async () => {
      req.body.mutations = 'invalid_mutations_format';

      await syncData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid mutations format',
      });
    });

    it('should process empty mutations array successfully and return updates', async () => {
      req.body.mutations = [];
      prisma.$transaction.mockImplementation(async (cb) => {
        return cb(prisma);
      });

      await syncData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Sync completed',
          processedIds: [],
          errors: [],
          updates: expect.objectContaining({
            categories: [],
            transactions: [],
            budgets: [],
            goals: [],
            subscriptions: [],
          }),
        })
      );
    });
  });

  describe('pullUpdates', () => {
    it('should fetch user updates and return status 200', async () => {
      await pullUpdates(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        updates: expect.objectContaining({
          categories: [],
          transactions: [],
          budgets: [],
          goals: [],
          subscriptions: [],
        }),
      });
    });
  });
});
