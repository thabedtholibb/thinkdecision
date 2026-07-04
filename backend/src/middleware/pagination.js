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
  buildPaginationResponse,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
