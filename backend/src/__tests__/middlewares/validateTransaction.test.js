import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCreateTransaction, validateUpdateTransaction } from '../../middlewares/validateTransaction.js';

describe('validateTransaction middleware', () => {
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

  describe('validateCreateTransaction', () => {
    it('should pass with valid fields', () => {
      req.body = {
        categoryId: '507f1f77bcf86cd799439011',
        amount: 50000,
        type: 'expense',
        date: '2026-08-27'
      };
      validateCreateTransaction(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail when missing required fields', () => {
      req.body = { amount: 50000 };
      validateCreateTransaction(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
    });

    it('should fail with invalid categoryId format', () => {
      req.body = {
        categoryId: 'invalid_id',
        amount: 50000,
        type: 'expense',
        date: '2026-08-27'
      };
      validateCreateTransaction(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid categoryId' });
    });

    it('should fail with non-positive amount', () => {
      req.body = {
        categoryId: '507f1f77bcf86cd799439011',
        amount: -10,
        type: 'expense',
        date: '2026-08-27'
      };
      validateCreateTransaction(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Amount must be a positive number' });
    });

    it('should fail with invalid transaction type', () => {
      req.body = {
        categoryId: '507f1f77bcf86cd799439011',
        amount: 50000,
        type: 'transfer',
        date: '2026-08-27'
      };
      validateCreateTransaction(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid transaction type' });
    });
  });

  describe('validateUpdateTransaction', () => {
    it('should pass when updating description', () => {
      req.body = { description: 'Updated note' };
      validateUpdateTransaction(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail when no update fields are provided', () => {
      req.body = {};
      validateUpdateTransaction(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No update fields provided' });
    });
  });
});
