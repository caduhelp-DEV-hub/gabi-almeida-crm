const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (fs.existsSync('.env')) {
  const envText = fs.readFileSync('.env', 'utf-8');
  envText.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^"(.*)"$/, '$1');
      process.env[key] = val;
    }
  });
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const testPath = 'users/test-file.txt';
  const testContent = Buffer.from('test contents');
  const { data, error } = await sb.storage.from('avatars').upload(testPath, testContent, { contentType: 'text/plain', upsert: true });
  console.log('Upload using Service Key:', data, error);
}

run();
