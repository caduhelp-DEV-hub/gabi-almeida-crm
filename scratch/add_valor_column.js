const fs = require('fs');

let token = '';
if (fs.existsSync('.env')) {
  const envFile = fs.readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^"(.*)"$/, '$1');
      if (key === 'SUPABASE_ACCESS_TOKEN') {
        token = val;
      }
    }
  });
}

const projectRef = 'eytsdlwvoggjrftkixwz';
const sql = `
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS valor NUMERIC;
`;

async function run() {
  if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN not found in .env');
    return;
  }
  console.log('Sending SQL query to Supabase API...');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to execute SQL:', res.status, err);
  } else {
    console.log('SQL query executed successfully (added valor column if not exists).');
  }
}

run();
