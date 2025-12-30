import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET байхгүй байна');
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  const { type: eventType, data } = evt;

  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = data;
        
        if (!email_addresses || email_addresses.length === 0) {
          return new Response('Error: No email address', { status: 400 });
        }

        await prisma.user.create({
          data: {
            clerkId: id,
            email: email_addresses[0].email_address,
            firstName: first_name || null,
            lastName: last_name || null,
            imageUrl: image_url || null,
          },
        });
        
        console.log('✅ User created:', id);
        break;
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = data;
        
        await prisma.user.update({
          where: { clerkId: id },
          data: {
            email: email_addresses[0]?.email_address,
            firstName: first_name || null,
            lastName: last_name || null,
            imageUrl: image_url || null,
          },
        });
        
        console.log('✅ User updated:', id);
        break;
      }

      case 'user.deleted': {
        const { id } = data;
        
        await prisma.user.delete({
          where: { clerkId: id as string },
        });
        
        console.log('✅ User deleted:', id);
        break;
      }

      default:
        console.log('Unhandled event type:', eventType);
    }

    return new Response('Webhook processed successfully', { status: 200 });
    
  } catch (error: any) {
    console.error('❌ Database error:', error);
    
    // Unique constraint error
    if (error.code === 'P2002') {
      return new Response('User already exists', { status: 200 });
    }
    
    return new Response('Error: Database error', { status: 500 });
  }
}