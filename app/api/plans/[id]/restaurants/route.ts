import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

/** POST /api/plans/[id]/restaurants - add a restaurant to a plan (set-union). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const { restaurant } = await req.json();
    const plans = await collections.plans();
    const result = await plans.updateOne(
      { _id: params.id, userId },
      { $addToSet: { restaurants: restaurant } }
    );
    return NextResponse.json({ ok: result.modifiedCount });
  });
}
