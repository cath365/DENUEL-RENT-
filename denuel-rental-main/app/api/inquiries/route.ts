import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req);
    
    // Check URL for type parameter
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'received';

    let threads;
    
    if (type === 'sent') {
      // For renters: fetch threads they started (sent inquiries)
      threads = await prisma.messageThread.findMany({
        where: { 
          messages: {
            some: {
              senderId: user.id
            }
          }
        },
        include: { 
          property: {
            include: {
              images: { take: 1 }
            }
          }, 
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }, 
          _count: { select: { messages: true } } 
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // For landlords/agents/admin: fetch threads for properties they own (received inquiries)
      if (!['LANDLORD', 'AGENT', 'ADMIN'].includes(user.role)) {
        // If user is not a landlord/agent, show their sent inquiries instead
        threads = await prisma.messageThread.findMany({
          where: { 
            messages: {
              some: {
                senderId: user.id
              }
            }
          },
          include: { 
            property: {
              include: {
                images: { take: 1 }
              }
            }, 
            messages: { orderBy: { createdAt: 'desc' }, take: 1 }, 
            _count: { select: { messages: true } } 
          },
          orderBy: { createdAt: 'desc' }
        });
      } else {
        threads = await prisma.messageThread.findMany({
          where: { property: { ownerId: user.id } },
          include: { 
            property: {
              include: {
                images: { take: 1 }
              }
            }, 
            messages: { orderBy: { createdAt: 'desc' }, take: 1 }, 
            _count: { select: { messages: true } } 
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    }

    const items = threads.map((t) => ({ 
      id: t.id, 
      property: t.property, 
      lastMessage: t.messages?.[0], 
      messageCount: t._count?.messages || 0,
      createdAt: t.createdAt
    }));
    
    return NextResponse.json({ items });
  } catch (e: any) {
    if (e instanceof Response) return e;
    console.error('Inquiries API error:', e);
    return NextResponse.json({ error: e?.message || 'Invalid request' }, { status: 400 });
  }
}
