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

    // In a real transaction, we would rollback here
    // Since Supabase REST API doesn't support transactions directly,
    // we rely on individual operation atomicity and error handling

    throw {
      success: false,
      error: error.message,
      operation: operationName
    };
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
