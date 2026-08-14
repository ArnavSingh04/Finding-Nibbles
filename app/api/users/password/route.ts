import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { collections } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

/** POST /api/users/password — change the current user's password. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Both current and new passwords are required");
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      throw new ApiError(400, "New password must be at least 6 characters");
    }

    const users = await collections.users();
    const user = await users.findOne({ _id: userId });
    if (!user) throw new ApiError(404, "User not found");

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new ApiError(400, "Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await users.updateOne({ _id: userId }, { $set: { passwordHash } });
    return NextResponse.json({ ok: true });
  });
}
