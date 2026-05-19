import { NextResponse } from "next/server";
import { demoFinishDay } from "@/lib/demo-store";
import { finishToday } from "@/lib/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(await finishToday(body).catch(() => demoFinishDay()));
}
