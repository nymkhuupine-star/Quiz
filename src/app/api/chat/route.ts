// app/api/chat/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { message, conversationHistory } = await req.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // GROQ API key-г .env файлаас авна
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ API key тохируулаагүй байна' },
        { status: 500 }
      )
    }

    // Build messages array with conversation history
    const messages = [
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('GROQ API Error:', errorData)
      
      return NextResponse.json(
        { error: errorData.error?.message || 'GROQ API алдаа' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content || 'Хариулт олдсонгүй'

    return NextResponse.json({ message: aiMessage })
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Алдаа гарлаа' },
      { status: 500 }
    )
  }
}