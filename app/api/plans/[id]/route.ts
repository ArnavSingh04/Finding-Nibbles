import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

/** GET /api/plans/[id] - a single plan owned by the user. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const plans = await collections.plans();
    const plan = await plans.findOne({ _id: params.id, userId });
    if (!plan) throw new ApiError(404, "Plan not found");
    return NextResponse.json(plan);
  });
}

/** PUT /api/plans/[id] - replace plan fields. */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const { title, restaurants, startingPoint, destination, tripStartDate } = await req.json();

    const plans = await collections.plans();
    const plan = await plans.findOne({ _id: params.id, userId });
    if (!plan) throw new ApiError(404, "Plan not found or not authorized");

    const result = await plans.updateOne(
      { _id: params.id, userId },
      {
        $set: {
          title,
          restaurants: Array.isArray(restaurants) ? restaurants : [],
          startingPoint,
          destination,
          tripStartDate: tripStartDate ? new Date(tripStartDate) : null,
        },
      }
    );
    return NextResponse.json({ ok: result.modifiedCount });
  });
}

/** DELETE /api/plans/[id] */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const userId = await requireUserId();
    const plans = await collections.plans();
    const plan = await plans.findOne({ _id: params.id, userId });
    if (!plan) throw new ApiError(404, "Plan not found or not authorized");
    const result = await plans.deleteOne({ _id: params.id, userId });
    return NextResponse.json({ ok: result.deletedCount });
  });
}
