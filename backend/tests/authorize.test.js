const { requireRole } = require('../src/middleware/authorize');

describe('requireRole middleware', () => {
  test('calls next() when the user has an allowed role', () => {
    const req = { user: { role: 'creator' } };
    const next = jest.fn();
    requireRole('creator')(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('throws a 403 ForbiddenError when the role is not allowed', () => {
    const req = { user: { role: 'expert' } };
    const next = jest.fn();
    expect(() => requireRole('creator')(req, {}, next)).toThrow(/permission/i);
    expect(next).not.toHaveBeenCalled();
  });

  test('throws when req.user is missing (not authenticated)', () => {
    const req = {};
    const next = jest.fn();
    expect(() => requireRole('creator')(req, {}, next)).toThrow();
    expect(next).not.toHaveBeenCalled();
  });

  test('supports multiple allowed roles', () => {
    const req = { user: { role: 'admin' } };
    const next = jest.fn();
    requireRole('creator', 'admin')(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('the thrown error carries a 403 status code', () => {
    const req = { user: { role: 'expert' } };
    try {
      requireRole('creator')(req, {}, jest.fn());
      throw new Error('expected requireRole to throw');
    } catch (err) {
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    }
  });
});
