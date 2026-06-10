const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function uploadBase64ToStorage(
  bucket,
  path,
  base64,
  contentType = 'image/png'
) {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const buffer = Buffer.from(base64Data, 'base64');

  const { error: uploadError } = await supabaseAnon.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });

  if (uploadError) {
    throw new Error(`Erro no upload: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseAnon.storage.from(bucket).getPublicUrl(path);
  return publicUrlData.publicUrl;
}

async function main() {
  const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='; // 1x1 png
  try {
    console.log('Attempting upload to avatars bucket using supabaseAnon...');
    console.log('URL:', supabaseUrl);
    console.log('Anon Key starts with:', supabaseAnonKey.slice(0, 15) + '...');
    const url = await uploadBase64ToStorage('avatars', 'test-folder/test-image-anon.png', testBase64, 'image/png');
    console.log('Upload successful! URL:', url);
  } catch (err) {
    console.error('Upload failed with error:', err);
  }
}

main();
