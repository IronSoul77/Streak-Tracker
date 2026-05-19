import { NextResponse } from "next/server";
import { demoResetStats } from "@/lib/demo-store";
import { resetStats } from "@/lib/server";

export async function POST() {
  const result = await resetStats().catch(() => demoResetStats());
  return NextResponse.json(result);
}
