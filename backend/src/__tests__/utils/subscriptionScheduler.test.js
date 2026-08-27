import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processSubscriptions } from '../../utils/subscriptionScheduler.js';
import { prisma } from '../../config/db.js';

vi.mock('../../config/db.js', () => ({
  prisma: {
    subscription: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('subscriptionScheduler util', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should exit early when no due subscriptions are found', async () => {
    prisma.subscription.findMany.mockResolvedValue([]);

    await processSubscriptions();

    expect(prisma.subscription.findMany).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('should process due subscriptions and schedule next billing date', async () => {
    const mockDueDate = new Date('2026-01-01');
    const mockSub = {
      id: 'sub-1',
      name: 'Netflix',
      amount: 150000,
      billingCycle: 'monthly',
      nextBillingDate: mockDueDate,
      userId: 'user-1',
      categoryId: 'cat-1',
    };

    prisma.subscription.findMany.mockResolvedValue([mockSub]);
    prisma.$transaction.mockImplementation(async (cb) => {
      return cb(prisma);
    });

    await processSubscriptions();

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: {
        amount: 150000,
        description: 'Subscription: Netflix',
        type: 'expense',
        date: mockDueDate,
        userId: 'user-1',
        categoryId: 'cat-1',
      },
    });
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sub-1' },
        data: expect.objectContaining({
          nextBillingDate: expect.any(Date),
        }),
      })
    );
  });
});
