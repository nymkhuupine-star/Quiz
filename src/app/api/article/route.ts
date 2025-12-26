import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    method: "GET",
    message: "gvg",
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({
    method: "POST",
    message: "fff",
    body,
  });
}
