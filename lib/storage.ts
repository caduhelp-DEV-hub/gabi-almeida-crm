import { supabaseAdmin } from './supabase';

export async function uploadBase64ToStorage(
  bucket: string,
  path: string,
  base64: string,
  contentType: string = 'image/png'
): Promise<string> {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const buffer = Buffer.from(base64Data, 'base64');

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });

  if (uploadError) {
    throw new Error(`Erro no upload: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return publicUrlData.publicUrl;
}
