import { NextRequest, NextResponse } from 'next/server';
import { uploadBase64ToStorage } from '../../../../lib/storage';
import { requireUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  try {
    const { bucket, path, base64, contentType } = await request.json();

    const ALLOWED_BUCKETS = ['avatars', 'patient-photos', 'documents', 'financeiro'];
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/svg+xml'];
    const MAX_SIZE_MB = 10;

    if (!bucket || !path || !base64) {
      return NextResponse.json(
        { error: 'bucket, path e base64 são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json({ error: 'Bucket não permitido.' }, { status: 400 });
    }

    if (contentType && !ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido.' }, { status: 400 });
    }

    if (base64.length > MAX_SIZE_MB * 1024 * 1024 * 1.37) {
      return NextResponse.json({ error: 'Arquivo excede o limite de 10MB.' }, { status: 400 });
    }

    const url = await uploadBase64ToStorage(bucket, path, base64, contentType);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err: any) {
    console.error('[Storage Upload] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
