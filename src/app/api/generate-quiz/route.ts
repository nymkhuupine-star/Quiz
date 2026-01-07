import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key байхгүй" }, 
        { status: 500 }
      );
    }

    const { text, title } = await req.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Текст хоосон байна" }, 
        { status: 400 }
      );
    }

    console.log("🎯 Quiz үүсгэж байна...");

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a quiz generator. Create 5 questions from the given text IN THE SAME LANGUAGE AS THE TEXT.
          
CRITICAL: If the text is in English, create questions in English. If the text is in Mongolian, create questions in Mongolian. DO NOT translate.

Return ONLY this JSON format, nothing else:

{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0
    }
  ]
}

correctAnswer is the index (0, 1, 2, or 3) of the correct option.`
        },
        {
          role: "user",
          content: `Title: ${title}\n\nText:\n${text}\n\nCreate 5 quiz questions from this text IN THE SAME LANGUAGE AS THE TEXT. Questions must be clear and relevant to the content.`
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2048,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";
    
    // JSON-г задлах
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSON олдсонгүй");
    }

    const quizData = JSON.parse(jsonMatch[0]);

    console.log("✅ Quiz амжилттай үүсгэгдлээ!");

    return NextResponse.json(quizData);

  } catch (error: any) {
    console.error("❌ Quiz үүсгэхэд алдаа:", error.message);
    
    return NextResponse.json({ 
      error: "Quiz үүсгэхэд алдаа гарлаа",
      details: error.message 
    }, { status: 500 });
  }
}