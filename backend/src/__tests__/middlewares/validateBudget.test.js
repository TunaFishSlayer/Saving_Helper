import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCreateBudget, validateUpdateBudget } from '../../middlewares/validateBudget.js';

describe('validateBudget middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
  });

  describe('validateCreateBudget', () => {
    it('should pass with valid budget fields', () => {
      req.body = {
        categoryId: '507f1f77bcf86cd799439011',
        amount: 5000000,
        period: 'monthly',
        startDate: '2026-08-01',
        alertThreshold: 80
      };
      validateCreateBudget(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail when missing required fields', () => {
      req.body = { amount: 5000000 };
      validateCreateBudget(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing required fields: categoryId, amount, period, startDate'
      });
    });

    it('should fail with invalid alertThreshold (> 100)', () => {
      req.body = {
        categoryId: '507f1f77bcf86cd799439011',
        amount: 5000000,
        period: 'monthly',
        startDate: '2026-08-01',
        alertThreshold: 150
      };
      validateCreateBudget(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Alert threshold must be a number between 0 and 100'
      });
    });
  });

  describe('validateUpdateBudget', () => {
    it('should pass when updating alertThreshold', () => {
      req.body = { alertThreshold: 90 };
      validateUpdateBudget(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail when no update fields are provided', () => {
      req.body = {};
      validateUpdateBudget(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No update fields provided'
      });
    });
  });
});
