import { NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

/** GET /api/onboarding/swipe — has the user completed the swipe intro? */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const users = await collections.users();
    const user = await users.findOne({ _id: userId }, { projection: { profile: 1 } });
    return NextResponse.json({
      completed: Boolean(user?.profile?.swipeOnboardingCompleted),
    });
  });
}

/** POST /api/onboarding/swipe — mark the swipe intro complete. */
export async function POST() {
  return handle(async () => {
    const userId = await requireUserId();
    const users = await collections.users();
    await users.updateOne(
      { _id: userId },
      { $set: { "profile.swipeOnboardingCompleted": true } }
    );
    return NextResponse.json({ ok: 1 });
  });
}
