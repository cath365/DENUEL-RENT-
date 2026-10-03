import prisma from '../../lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const properties = await prisma.property.findMany({ where: { status: 'APPROVED' }, select: { id: true, updatedAt: true }, take: 500, orderBy: { updatedAt: 'desc' } });
  const staticRoutes = ['/', '/rent', '/buy', '/land', '/commercial', '/agents', '/services', '/market', '/ask-denuel', '/renters-guide', '/safety-tips'];
  const staticXml = staticRoutes.map((path) => `  <url><loc>${base}${path}</loc></url>`).join('\n');
  const propertyXml = properties.map((p) => `  <url><loc>${base}/property/${p.id}</loc><lastmod>${p.updatedAt.toISOString()}</lastmod></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticXml}\n${propertyXml}\n</urlset>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
