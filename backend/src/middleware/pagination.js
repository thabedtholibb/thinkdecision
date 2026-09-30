// Pagination middleware and utilities

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePaginationParams = (query) => {
  let limit = parseInt(query.limit) || DEFAULT_LIMIT;
  let offset = parseInt(query.offset) || 0;

  // Clamp limit to valid range
  limit = Math.min(Math.max(limit, 1), MAX_LIMIT);

  // Ensure offset is non-negative
  offset = Math.max(offset, 0);

  return { limit, offset };
};

// Keyset pagination (stable under inserts; for unbounded tables).
// Cursor format: "<created_at ISO>|<id>". Returns { ts, id } or null.
// Usage: pass cursor + order('created_at', desc) + order('id', desc),
// fetch limit+1 rows, then nextCursorFrom(rows, limit).
const parseCursor = (query) => {
  const raw = query.cursor;
  if (!raw || typeof raw !== 'string') return null;
  const sep = raw.lastIndexOf('|');
  if (sep < 1) return null;
  const ts = raw.slice(0, sep);
  const id = raw.slice(sep + 1);
  if (!ts || !id || Number.isNaN(Date.parse(ts))) return null;
  return { ts, id };
};

const applyCursor = (qb, cursor) => {
  if (!cursor) return qb;
  // created_at DESC, id DESC: rows strictly before the cursor position.
  // postgrest-js .or() with explicit AND grouping for the tiebreak.
  return qb.or(
    `created_at.lt.${cursor.ts},and(created_at.eq.${cursor.ts},id.lt.${cursor.id})`
  );
};

const nextCursorFrom = (rows, limit) => {
  if (!rows || rows.length <= limit) return null;
  const last = rows[limit - 1];
  if (!last?.created_at || !last?.id) return null;
  const ts = last.created_at instanceof Date ? last.created_at.toISOString() : last.created_at;
  return `${ts}|${last.id}`;
};

const paginationMiddleware = (req, res, next) => {
  const { limit, offset } = parsePaginationParams(req.query);
  req.pagination = { limit, offset };
  next();
};

const buildPaginationResponse = (items, total, limit, offset) => {
  return {
    data: items,
    pagination: {
      total,
      limit,
      offset,
      pages: Math.ceil(total / limit),
      currentPage: Math.floor(offset / limit) + 1,
      hasNext: offset + limit < total,
      hasPrev: offset > 0,
    },
  };
};

module.exports = {
  paginationMiddleware,
  parsePaginationParams,
  parseCursor,
  applyCursor,
  nextCursorFrom,
  buildPaginationResponse,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
