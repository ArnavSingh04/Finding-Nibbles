import { NextRequest, NextResponse } from "next/server";
import { collections, randomId } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/plans - all plans for the current user. */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const plans = await collections.plans();
    const items = await plans.find({ userId }).toArray();
    return NextResponse.json(items);
  });
}

/** POST /api/plans - create a new (empty) plan. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { title, startingPoint, destination, tripStartDate } = await req.json();
    if (typeof title !== "string" || !title.trim()) throw new ApiError(400, "title is required");

    const _id = randomId();
    const plans = await collections.plans();
    await plans.insertOne({
      _id,
      userId,
      title: title.trim(),
      restaurants: [],
      startingPoint,
      destination,
      tripStartDate: tripStartDate ? new Date(tripStartDate) : null,
    });
    return NextResponse.json({ _id });
  });
}
