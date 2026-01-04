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
          content: `Та quiz асуулт үүсгэгч юм. Өгөгдсөн текстээс 5 асуулт үүсгэнэ үү. 
          
МАШ ЧУХАЛ: Хариугаа яг энэ JSON форматаар буцаа, өөр юу ч бүү нэм:

{
  "questions": [
    {
      "question": "Асуултын текст?",
      "options": ["A сонголт", "B сонголт", "C сонголт", "D сонголт"],
      "correctAnswer": 0
    }
  ]
}

correctAnswer нь зөв хариултын индекс (0, 1, 2, эсвэл 3) байна.`
        },
        {
          role: "user",
          content: `Гарчиг: ${title}\n\nТекст:\n${text}\n\nЭнэ текстээс 5 quiz асуулт үүсгэж өгнө үү. Асуултууд нь текстийн агуулгатай холбоотой, ойлгомжтой байх ёстой.`
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