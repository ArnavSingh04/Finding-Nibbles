import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

/** POST /api/users/profile — update display name + preferences. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { name, preferences } = await req.json();
    const users = await collections.users();
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          "profile.name": name,
          "profile.preferences": Array.isArray(preferences) ? preferences : [],
        },
      }
    );
    return NextResponse.json({ ok: true });
  });
}
