const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!ACCESS_TOKEN || !SUPABASE_URL) {
  console.error('Missing env');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)[1];

async function main() {
  const query = `
    SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'storage';
  `;
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
