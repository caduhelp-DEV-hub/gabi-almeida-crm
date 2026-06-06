import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import { verifySessionToken, COOKIE_NAME } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const decoded = verifySessionToken(token);
    if (!decoded) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, username, role, status, specialty, phone, avatar, commission_rate, permissions, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      const response = NextResponse.json({ user: null }, { status: 200 });
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      status: user.status,
      specialty: user.specialty,
      phone: user.phone,
      avatar: user.avatar,
      commissionRate: user.commission_rate,
      permissions: user.permissions,
      createdAt: user.created_at
    };

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (err) {
    console.error('[Auth Session] Error:', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
