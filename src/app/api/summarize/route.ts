import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // API Key шалгах
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("❌ GROQ API Key байхгүй байна!");
      return NextResponse.json(
        { error: "API Key тохируулаагүй байна" }, 
        { status: 500 }
      );
    }

    // Текст авах
    const { text } = await req.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Текст хоосон байна" }, 
        { status: 400 }
      );
    }

    console.log("✅ API Key олдлоо");
    console.log("✅ Текст олдлоо, урт:", text.length);
    console.log("🔄 Groq API руу хүсэлт илгээж байна...");

    // Groq client үүсгэх
    const groq = new Groq({ apiKey });

    // AI-г дуудах
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Та мэргэжлийн хураангуйлагч юм. Текстийг ойлгомжтой, товч Монгол хэлээр хураангуйл. Зөвхөн хураангуйг л бич, өөр юу ч бүү нэм."
        },
        {
          role: "user",
          content: `Дараах текстийг Монгол хэлээр хураангуйл:\n\n${text}`
        }
      ],
      model: "llama-3.3-70b-versatile", // Хамгийн сайн загвар
      temperature: 0.3, // Бага = илүү тодорхой
      max_tokens: 1024,
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