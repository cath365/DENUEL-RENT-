import { NextResponse } from 'next/server';
import { verifyRefreshToken, revokeRefreshTokenByJti, issueTokens } from '../../../../lib/auth';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/denuel_refresh=([^;]+)/);
    if (!match) return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    const raw = match[1];
    const verified = await verifyRefreshToken(raw);
    if (!verified) return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });

    const { user, jti } = verified as any;
    // rotate
    await revokeRefreshTokenByJti(jti);

    const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    await issueTokens(res, user);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 });
  }
}