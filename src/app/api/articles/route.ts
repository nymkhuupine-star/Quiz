import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { generateSummary } from '@/lib/gemini'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// Бүх нийтлэл авах
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const articles = await prisma.article.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        quizzes: true,
      },
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Шинэ нийтлэл үүсгэх + хураангуй
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { title, text } = await req.json()

    if (!title || !text) {
      return NextResponse.json({ error: 'Title and text are required' }, { status: 400 })
    }

    // AI хураангуй үүсгэх
    const summary = await generateSummary(title, text)

    // Database-д хадгалах
    const article = await prisma.article.create({
      data: {
        userId: user.id,
        title,
        originalText: text,
       summary: summary || "",
      },
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}