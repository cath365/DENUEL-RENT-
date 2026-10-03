import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import prisma from './prisma';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const TOKEN_NAME = 'denuel_token';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'changeme';
const REFRESH_TOKEN_NAME = 'denuel_refresh';
const CSRF_COOKIE_NAME = 'denuel_csrf';

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}


export function hashPassword(password: string) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export function signJwt(payload: object, expiresIn: string | number = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt<T extends object = any>(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (e) {
    return null;
  }
}

export function setAuthCookie(res: NextResponse, token: string) {
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  res.headers.append('Set-Cookie', `${TOKEN_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`);
  return res;
}

export async function getUserFromToken(token: string) {
  const decoded = verifyJwt<{ id: string }>(token);
  if (!decoded || !decoded.id) return null;
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) return null;
  // remove sensitive fields
  // @ts-ignore
  delete user.password;
  return user;
}

export function requireRole(user: any, roles: string[] = []) {
  if (!user) return false;
  return roles.includes(user.role);
}

// Soft auth - returns user if logged in, null otherwise (no throw)
export async function getUser(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/denuel_token=([^;]+)/);
    if (!match) return null;
    const token = match[1];
    const decoded = verifyJwt<{ id: string; role: string }>(token);
    if (!decoded) return null;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return null;
    // @ts-ignore
    delete user.password;
    return user;
  } catch (e) {
    return null;
  }
}

export async function requireAuth(req: Request, roles: string[] = []) {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/denuel_token=([^;]+)/);
  if (!match) throw new Response('Unauthorized', { status: 401 });
  const token = match[1];
  const decoded = verifyJwt<{ id: string; role: string }>(token);
  if (!decoded) throw new Response('Unauthorized', { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) throw new Response('Unauthorized', { status: 401 });
  if (roles.length && !roles.includes(user.role)) throw new Response('Forbidden', { status: 403 });
  // @ts-ignore
  delete user.password;
  return user;
}

export function requireRoleOrThrow(user: any, roles: string[] = []) {
  if (!user) throw new Response('Unauthorized', { status: 401 });
  if (roles.length && !roles.includes(user.role)) throw new Response('Forbidden', { status: 403 });
  return true;
}

export function setRefreshCookie(res: NextResponse, token: string) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  res.headers.append('Set-Cookie', `${REFRESH_TOKEN_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`);
  return res;
}

export function clearAuthCookies(res: NextResponse) {
  res.headers.append('Set-Cookie', `denuel_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`);
  res.headers.append('Set-Cookie', `${REFRESH_TOKEN_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure=${process.env.NODE_ENV==='production'}`);
  return res;
}

export async function issueTokens(res: NextResponse, user: any) {
  const token = signJwt({ id: user.id, role: user.role }, '7d'); // 7 days for access token
  const jti = crypto.randomUUID();
  const refreshToken = jwt.sign({ id: user.id, jti }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash, jti, expiresAt } });
  // set access + refresh cookies
  setAuthCookie(res, token);
  setRefreshCookie(res, refreshToken);
  // set CSRF double-submit cookie (not HttpOnly so frontend can read it)
  const csrf = crypto.randomBytes(24).toString('hex');
  const csrfMax = 60 * 60 * 24; // 1 day
  res.headers.append('Set-Cookie', `${CSRF_COOKIE_NAME}=${csrf}; Path=/; Max-Age=${csrfMax}; SameSite=Lax; Secure=${process.env.NODE_ENV==='production'}`);
  return res;
}

export async function verifyRefreshToken(rawToken: string | null) {
  if (!rawToken) return null;
  try {
    const decoded = jwt.verify(rawToken, REFRESH_TOKEN_SECRET) as any;
    const jti = decoded.jti;
    const record = await prisma.refreshToken.findUnique({ where: { jti } });
    if (!record) return null;
    if (record.isRevoked) return null;
    if (record.expiresAt < new Date()) return null;
    const tokenHash = hashToken(rawToken);
    if (tokenHash !== record.tokenHash) return null;
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return null;
    // @ts-ignore
    delete user.password;
    return { user, jti };
  } catch (e) {
    return null;
  }
}

export function requireCsrf(req: Request) {
  const header = (req.headers.get('x-csrf-token') || '').toString();
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  if (!match) throw new Response('Invalid CSRF token', { status: 403 });
  const csrf = match[1];
  if (!header || header !== csrf) throw new Response('Invalid CSRF token', { status: 403 });
  return true;
}

export async function revokeRefreshTokenByJti(jti: string) {
  await prisma.refreshToken.updateMany({ where: { jti }, data: { isRevoked: true } });
}