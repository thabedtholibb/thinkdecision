const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    realtime: {
      transport: 'websockets',
    },
  }
);

// For Node.js < 22, provide ws as transport
if (process.versions.node < '22.0.0') {
  supabase.realtime.transport = ws;
}

module.exports = supabase;
