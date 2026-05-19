import { NextResponse } from "next/server";
import { demoDashboardData } from "@/lib/demo-store";
import { getDashboardData } from "@/lib/server";

export async function GET() {
  const data = await getDashboardData().catch(() => demoDashboardData());
  return NextResponse.json(data);
}
