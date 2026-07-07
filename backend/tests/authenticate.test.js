process.env.JWT_SECRET = 'test-secret-for-unit-tests-only';

const jwt = require('jsonwebtoken');
const authenticate = require('../src/middleware/authenticate');

const mockRes = () => ({ clearCookie: jest.fn() });

describe('authenticate middleware', () => {
  test('throws a 401 when no token is present in cookie or header', () => {
    const req = { cookies: {}, headers: {} };
    expect(() => authenticate(req, mockRes(), jest.fn())).toThrow(/Missing authorization token/);
  });

  test('accepts a valid token from the httpOnly cookie and populates req.user', () => {
    const token = jwt.sign({ id: 'u1', role: 'creator' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = { cookies: { authToken: token }, headers: {} };
    const next = jest.fn();
    authenticate(req, mockRes(), next);
    expect(req.user.id).toBe('u1');
    expect(req.user.role).toBe('creator');
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('falls back to the Authorization header when no cookie is present', () => {
    const token = jwt.sign({ id: 'u2', role: 'expert' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const req = { cookies: {}, headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    authenticate(req, mockRes(), next);
    expect(req.user.id).toBe('u2');
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('throws TOKEN_EXPIRED and clears the cookie for an expired token', () => {
    const token = jwt.sign({ id: 'u3' }, process.env.JWT_SECRET, { expiresIn: -10 });
    const req = { cookies: { authToken: token }, headers: {} };
    const res = mockRes();
    try {
      authenticate(req, res, jest.fn());
      throw new Error('expected authenticate to throw');
    } catch (err) {
      expect(err.code).toBe('TOKEN_EXPIRED');
      expect(err.statusCode).toBe(401);
    }
    expect(res.clearCookie).toHaveBeenCalledWith('authToken');
  });

  test('rejects a token signed with the wrong secret', () => {
    const token = jwt.sign({ id: 'u4' }, 'not-the-real-secret', { expiresIn: '1h' });
    const req = { cookies: { authToken: token }, headers: {} };
    expect(() => authenticate(req, mockRes(), jest.fn())).toThrow(/Invalid token/);
  });
});
