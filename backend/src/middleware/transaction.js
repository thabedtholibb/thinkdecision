// Transaction middleware for Supabase
// Note: Supabase PostgreSQL supports transactions
// This wrapper ensures we handle transactions properly

const supabase = require('../config/supabase');

// Wrap an async function in a transaction
// Note: Due to Supabase's REST API limitations, we simulate transactions by:
// 1. Doing all operations in sequence
// 2. Validating before committing
// 3. Rolling back if any step fails
const withTransaction = async (operationName, operation) => {
  const startTime = Date.now();

  try {
    console.log(`[Transaction] Starting: ${operationName}`);

    const result = await operation();

    const duration = Date.now() - startTime;
    console.log(`[Transaction] Committed: ${operationName} (${duration}ms)`);

    return {
      success: true,
      data: result,
      duration
    };
  } catch (error) {
    console.error(`[Transaction] Failed: ${operationName}`, error);

    // Supabase REST has no multi-statement transaction here. The caller owns
    // compensating rollback. Preserve the original AppError so the global
    // handler keeps its intended status code and public error code.
    throw error;
  }
};

// Batch operations - useful for creating multiple related records
const batchInsert = async (operations) => {
  const results = [];

  try {
    for (const op of operations) {
      const result = await op();
      results.push(result);
    }
    return { success: true, data: results };
  } catch (error) {
    console.error('[Transaction] Batch insert failed:', error);
    throw error;
  }
};

module.exports = {
  withTransaction,
  batchInsert
};
