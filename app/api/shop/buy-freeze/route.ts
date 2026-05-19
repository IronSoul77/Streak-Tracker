import { NextResponse } from "next/server";
import { demoBuyFreeze } from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";
import { ensureSingletons, FREEZE_COST, WALLET_ID } from "@/lib/server";

export async function POST() {
  const result = await (async () => {
    await ensureSingletons();
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: WALLET_ID } });

    if (wallet.coins < FREEZE_COST) {
      return { ok: false, message: "You need more coins to buy this.", wallet };
    }

    const updated = await prisma.wallet.update({
      where: { id: WALLET_ID },
      data: { coins: { decrement: FREEZE_COST }, streakFreezes: { increment: 1 } }
    });

    return { ok: true, wallet: updated };
  })().catch(() => demoBuyFreeze());

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
