// Method registry. Code is the runtime source of truth; the `methods` table
// (migration 2025100107) mirrors this metadata for FK integrity only.
const Joi = require('joi');

const registry = Object.fromEntries(
  [require('./ahp'), require('./anp'), require('./fuzzyAhp'), require('./fuzzyAnp'), require('./ism'), require('./micmac')]
    .map((m) => [m.meta.code, m])
);

// 'Fuzzy AHP' -> 'FUZZY_AHP'; canonical codes pass through; unknown input is
// returned unchanged so callers can still reject it.
const normalizeCode = (str) => {
  const code = String(str ?? '').trim().toUpperCase().replace(/\s+/g, '_');
  return registry[code] ? code : str;
};

const get = (code) => registry[normalizeCode(code)];

const list = () => Object.values(registry).map((m) => m.meta).sort((a, b) => a.sort_order - b.sort_order);

const selectableCodes = () => list().filter((m) => m.is_selectable).map((m) => m.code);

// Values a method may be stored as before migration 2025100107 normalizes the
// column (e.g. 'Fuzzy AHP'), for equality filters on cases.method.
const storedValues = (code) => {
  const meta = get(code)?.meta;
  return meta ? [...new Set([meta.code, meta.label])] : [code];
};

// Joi rule for request bodies: accepts legacy labels, yields the canonical code.
const methodSchema = Joi.string().custom((value, helpers) => {
  const code = normalizeCode(value);
  return selectableCodes().includes(code) ? code : helpers.error('any.invalid');
}, 'method code');

module.exports = { get, list, normalizeCode, selectableCodes, storedValues, methodSchema };
