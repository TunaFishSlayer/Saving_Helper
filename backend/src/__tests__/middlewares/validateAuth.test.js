import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateRegister,
  validateLogin,
  validateResetPasswordRequest,
  validateResetPassword
} from '../../middlewares/validateAuth.js';

describe('validateAuth middleware', () => {
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

  describe('validateRegister', () => {
    it('should pass with valid email, password, and name', () => {
      req.body = { email: 'test@example.com', password: 'password123', name: 'Test User' };
      validateRegister(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail when fields are missing', () => {
      req.body = { email: 'test@example.com' };
      validateRegister(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
    });

    it('should fail with invalid email format', () => {
      req.body = { email: 'invalid-email', password: 'password123', name: 'Test User' };
      validateRegister(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email format' });
    });

    it('should fail with short password (< 6 chars)', () => {
      req.body = { email: 'test@example.com', password: '123', name: 'Test User' };
      validateRegister(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Password must be at least 6 characters' });
    });
  });

  describe('validateLogin', () => {
    it('should pass with valid email and password', () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      validateLogin(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail with missing fields', () => {
      req.body = { email: 'test@example.com' };
      validateLogin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing email or password' });
    });
  });

  describe('validateResetPasswordRequest', () => {
    it('should pass with valid email', () => {
      req.body = { email: 'test@example.com' };
      validateResetPasswordRequest(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail with missing email', () => {
      req.body = {};
      validateResetPasswordRequest(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Email is required' });
    });
  });

  describe('validateResetPassword', () => {
    it('should pass with valid email, 6-digit code, and new password', () => {
      req.body = { email: 'test@example.com', code: '123456', newPassword: 'newPassword123' };
      validateResetPassword(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should fail with invalid code format (not 6 digits)', () => {
      req.body = { email: 'test@example.com', code: '123', newPassword: 'newPassword123' };
      validateResetPassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid code format' });
    });
  });
});
