import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import authMiddleware from '../../middlewares/authMiddleware.js';

describe('authMiddleware', () => {
  let req;
  let res;
  let next;
  const JWT_SECRET = 'test_jwt_secret_123';

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    req = {
      headers: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();
  });

  it('should return 401 if Authorization header is missing and no device UUID header', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Authorization token missing'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow Guest access if x-device-uuid header is present without token', () => {
    req.headers['x-device-uuid'] = 'device-uuid-999';

    authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.isGuest).toBe(true);
    expect(req.user.userId).toBe('guest_device-uuid-999');
    expect(req.user.email).toBe('offline@guest');
    expect(next).toHaveBeenCalled();
  });

  it('should verify valid Bearer token and attach user to req', () => {
    const payload = {
      userId: 'user-id-123',
      email: 'user@example.com',
      name: 'Test User'
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    req.headers.authorization = `Bearer ${token}`;

    authMiddleware(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user.isGuest).toBe(false);
    expect(req.user.userId).toBe('user-id-123');
    expect(req.user.email).toBe('user@example.com');
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 when Bearer token is invalid or expired', () => {
    req.headers.authorization = 'Bearer invalid.jwt.token';

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid or expired token'
    });
    expect(next).not.toHaveBeenCalled();
  });
});
