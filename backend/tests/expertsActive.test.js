// GET /experts/active against an in-memory Supabase fake: no DB, no login.
const express = require('express');
const request = require('supertest');

const TABLES = {
  cases: [
    { id: 'c1', creator_id: 'me' },
    { id: 'c2', creator_id: 'me' },
    { id: 'cX', creator_id: 'other' },
  ],
  case_experts: [
    { case_id: 'c1', expert_id: 'e1', status: 'invited' },
    { case_id: 'c2', expert_id: 'e1', status: 'in_progress' },
    { case_id: 'c1', expert_id: 'e2', status: 'completed' },
    { case_id: 'cX', expert_id: 'e3', status: 'invited' },
  ],
  users: [
    { id: 'e1', name: 'Pakar Satu', email: 'e1@example.com', institution: 'A' },
    { id: 'e2', name: 'Pakar Dua', email: 'e2@example.com', institution: 'B' },
    { id: 'e3', name: 'Pakar Tiga', email: 'e3@example.com', institution: 'C' },
  ],
};

jest.mock('../src/config/supabase', () => ({
  from(table) {
    let rows = TABLES[table];
    const q = {
      select: () => q,
      eq: (col, v) => { rows = rows.filter((r) => r[col] === v); return q; },
      in: (col, vs) => { rows = rows.filter((r) => vs.includes(r[col])); return q; },
      then: (ok) => ok({ data: rows, error: null }),
    };
    return q;
  },
}));
jest.mock('../src/middleware/authenticate', () => (req, _res, next) => {
  req.user = { id: 'me', role: 'creator' };
  next();
});

const app = express().use('/experts', require('../src/routes/experts'));

test('lists only experts on the creator\'s own cases, one row each', async () => {
  const res = await request(app).get('/experts/active');
  expect(res.status).toBe(200);
  expect(res.body.data).toEqual([
    expect.objectContaining({ id: 'e1', status: 'Mengisi' }),
  ]);
});
