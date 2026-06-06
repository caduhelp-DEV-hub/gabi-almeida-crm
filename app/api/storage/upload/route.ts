import { NextRequest, NextResponse } from 'next/server';
import { uploadBase64ToStorage } from '../../../../lib/storage';
import { requireUser } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  try {
    const { bucket, path, base64, contentType } = await request.json();

    if (!bucket || !path || !base64) {
      return NextResponse.json(
        { error: 'bucket, path e base64 são obrigatórios.' },
        { status: 400 }
      );
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
