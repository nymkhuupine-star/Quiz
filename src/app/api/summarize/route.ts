import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("❌ GROQ API Key байхгүй байна!");
      return NextResponse.json(
        { error: "API Key тохируулаагүй байна" }, 
        { status: 500 }
      );
    }

    const { text } = await req.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Текст хоосон байна" }, 
        { status: 400 }
      );
    }

    console.log("✅ Текст олдлоо, урт:", text.length);
    console.log("🔄 Groq API руу хүсэлт илгээж байна...");

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional summarizer. Detect the language of the text and summarize it IN THE SAME LANGUAGE. If the text is in English, summarize in English. If the text is in Mongolian, summarize in Mongolian. DO NOT translate. Only provide the summary, nothing else. Write naturally and correctly."
        },
        {
          role: "user",
          content: `Summarize the following text in its original language:\n\n${text}`
        }
      ],
      // Одоогийн идэвхтэй моделиуд:
      model: "llama-3.3-70b-versatile", // Эсвэл доорх моделиудыг турш
      // model: "llama-3.1-8b-instant",
      // model: "mixtral-8x7b-32768",
      // model: "gemma2-9b-it",
      temperature: 0.5,
      max_tokens: 1024,
      top_p: 0.9,
    });

    const summary = chatCompletion.choices[0]?.message?.content || "Хураангуй үүсгэж чадсангүй";

    console.log("✅ Хураангуй амжилттай үүсгэгдлээ!");
    console.log("📝 Урт:", summary.length, "тэмдэгт");

    return NextResponse.json({ 
      summary,
      model: "llama-3.3-70b-versatile"
    });

  } catch (error: any) {
    console.error("❌ ===== GROQ API АЛДАА =====");
    console.error("Message:", error.message);
    console.error("Full error:", error);
    
    return NextResponse.json({ 
      error: "Хураангуй үүсгэхэд алдаа гарлаа",
      details: error.message 
    }, { status: 500 });
  }
}