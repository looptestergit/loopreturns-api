import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "Missing password" }, { status: 400 });
    }

    if (password === process.env.DASHBOARD_PASSWORD) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });

  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
