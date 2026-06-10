const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!ACCESS_TOKEN || !SUPABASE_URL) {
  console.error('Missing env');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)[1];

async function main() {
  const query = `
    -- Drop existing policies if any to avoid duplicates
    DROP POLICY IF EXISTS "Public Access avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Public Access signatures" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public uploads to avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public uploads to signatures" ON storage.objects;

    -- Create new permissive policies for avatars and signatures
    CREATE POLICY "Public Access avatars" ON storage.objects FOR ALL TO public USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
    CREATE POLICY "Public Access signatures" ON storage.objects FOR ALL TO public USING (bucket_id = 'signatures') WITH CHECK (bucket_id = 'signatures');
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
  const text = await res.text();
  console.log('Response:', text);
}

main().catch(console.error);
