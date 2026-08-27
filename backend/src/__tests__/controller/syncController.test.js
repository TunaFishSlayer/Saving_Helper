import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncData, pullUpdates } from '../../controller/syncController.js';
import { prisma } from '../../config/db.js';

// Mock Prisma
vi.mock('../../config/db.js', () => ({
  prisma: {
    $transaction: vi.fn(),
    category: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    transaction: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    budget: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    goal: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    subscription: {
      findUnique: vi.fn(),
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

    it('should deduplicate category by systemCode if a category with the same systemCode exists', async () => {
      const mockTx = {
        category: {
          findUnique: vi.fn().mockResolvedValue(null), // Brand new clientUuid -> triggers findFirst deduplication
          findFirst: vi.fn().mockImplementation(({ where }) => {
            if (where.systemCode === 'FOOD_DINING') {
              return Promise.resolve({
                id: 'existing-db-id-100',
                clientUuid: 'old-uuid-000',
                userId: 'user-id-test-123',
                name: 'Ăn uống',
                systemCode: 'FOOD_DINING',
                type: 'expense'
              });
            }
            return Promise.resolve(null);
          }),
          update: vi.fn().mockResolvedValue({
            id: 'existing-db-id-100',
            clientUuid: 'new-client-uuid-999',
            userId: 'user-id-test-123',
            name: 'Food & Dining',
            systemCode: 'FOOD_DINING',
            type: 'expense'
          }),
          create: vi.fn(),
          findMany: vi.fn().mockResolvedValue([])
        },
        transaction: { findMany: vi.fn().mockResolvedValue([]) },
        budget: { findMany: vi.fn().mockResolvedValue([]) },
        goal: { findMany: vi.fn().mockResolvedValue([]) },
        subscription: { findMany: vi.fn().mockResolvedValue([]) }
      };

      prisma.$transaction.mockImplementation(async (cb) => cb(mockTx));

      req.body.mutations = [
        {
          id: 1,
          action: 'create',
          entityType: 'category',
          clientUuid: 'new-client-uuid-999',
          payload: {
            name: 'Food & Dining',
            systemCode: 'FOOD_DINING',
            type: 'expense'
          }
        }
      ];

      await syncData(req, res);

      expect(mockTx.category.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-id-test-123', systemCode: 'FOOD_DINING' }
      });

      // Verifies update was called instead of create (linking the existing category to clientUuid)
      expect(mockTx.category.update).toHaveBeenCalled();
      expect(mockTx.category.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should fallback to name deduplication if systemCode is not present', async () => {
      const mockTx = {
        category: {
          findUnique: vi.fn().mockResolvedValue(null), // Brand new clientUuid -> triggers findFirst deduplication
          findFirst: vi.fn().mockImplementation(({ where }) => {
            if (where.name === 'Custom Investments') {
              return Promise.resolve({
                id: 'existing-db-id-200',
                clientUuid: 'old-custom-uuid',
                userId: 'user-id-test-123',
                name: 'Custom Investments',
                systemCode: null
              });
            }
            return Promise.resolve(null);
          }),
          update: vi.fn().mockResolvedValue({
            id: 'existing-db-id-200',
            userId: 'user-id-test-123',
            clientUuid: 'new-custom-uuid',
            name: 'Custom Investments'
          }),
          create: vi.fn(),
          findMany: vi.fn().mockResolvedValue([])
        },
        transaction: { findMany: vi.fn().mockResolvedValue([]) },
        budget: { findMany: vi.fn().mockResolvedValue([]) },
        goal: { findMany: vi.fn().mockResolvedValue([]) },
        subscription: { findMany: vi.fn().mockResolvedValue([]) }
      };

      prisma.$transaction.mockImplementation(async (cb) => cb(mockTx));

      req.body.mutations = [
        {
          id: 2,
          action: 'create',
          entityType: 'category',
          clientUuid: 'new-custom-uuid',
          payload: {
            name: 'Custom Investments',
            type: 'income'
          }
        }
      ];

      await syncData(req, res);

      expect(mockTx.category.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-id-test-123', name: 'Custom Investments' }
      });
      expect(mockTx.category.update).toHaveBeenCalled();
      expect(mockTx.category.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
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
