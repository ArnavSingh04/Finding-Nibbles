import { NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

// Reads the session (headers) — must never be statically prerendered.
export const dynamic = "force-dynamic";

/** GET /api/users/me — current user's public profile. */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const users = await collections.users();
    const user = await users.findOne(
      { _id: userId },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      _id: user._id,
      username: user.username,
      profile: user.profile ?? {},
    });
  });
}
