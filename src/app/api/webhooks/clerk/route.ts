// app/api/webhooks/clerk/route.ts
// Clerk-ээс хэрэглэгч бүртгүүлэх үед автоматаар дуудагдана

import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  // Webhook secret key (.env файлаас авна)
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SECRET алга байна')
  }

  // Webhook headers авах
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // Headers шалгах
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    })
  }

  // Request body авах
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Webhook instance үүсгэх
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Webhook verify хийх (Clerk-ээс ирсэн эсэхийг шалгах)
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verify алдаа:', err)
    return new Response('Error: Verification failed', {
      status: 400,
    })
  }

  // Event type шалгах
  const eventType = evt.type

  // Хэрэглэгч бүртгүүлсэн үед
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    try {
      // Database-д user үүсгэх
      const user = await prisma.user.create({
        data: {
          clerkId: id, // Clerk-ийн ID
          email: email_addresses[0].email_address, // Email
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        },
      })

      console.log('✅ Шинэ хэрэглэгч үүсгэгдлээ:', user)

      return NextResponse.json({ message: 'User үүсгэгдлээ', userId: user.id })
    } catch (error) {
      console.error('❌ User үүсгэхэд алдаа:', error)
      return NextResponse.json(
        { error: 'Database алдаа' },
        { status: 500 }
      )
    }
  }

  // Хэрэглэгч мэдээлэл шинэчлэгдсэн үед
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data

    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: email_addresses[0].email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        },
      })

      console.log('✅ Хэрэглэгч шинэчлэгдлээ')
      return NextResponse.json({ message: 'User шинэчлэгдлээ' })
    } catch (error) {
      console.error('❌ User шинэчлэхэд алдаа:', error)
      return NextResponse.json(
        { error: 'Database алдаа' },
        { status: 500 }
      )
    }
  }

  // Хэрэглэгч устгагдсан үед
  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      await prisma.user.delete({
        where: { clerkId: id as string },
      })

      console.log('✅ Хэрэглэгч устгагдлаа')
      return NextResponse.json({ message: 'User устгагдлаа' })
    } catch (error) {
      console.error('❌ User устгахад алдаа:', error)
      return NextResponse.json(
        { error: 'Database алдаа' },
        { status: 500 }
      )
    }
  }

  return new Response('', { status: 200 })
}