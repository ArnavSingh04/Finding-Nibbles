import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { collections, ensureIndexes, randomId } from "@/lib/models";
import { ApiError, handle } from "@/lib/session";

/** POST /api/auth/register — replaces Meteor's Accounts.createUser. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const { username, email, password, name } = await req.json();

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      throw new ApiError(400, "Username must be at least 3 characters");
    }
    if (!password || typeof password !== "string" || password.length < 4) {
      throw new ApiError(400, "Password must be at least 4 characters");
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new ApiError(400, "A valid email address is required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    await ensureIndexes();
    const users = await collections.users();
    const existing = await users.findOne({
      $or: [{ username: username.trim() }, { email: normalizedEmail }],
    });
    if (existing) {
      const taken = existing.email === normalizedEmail ? "Email" : "Username";
      throw new ApiError(409, `${taken} already taken`);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await users.insertOne({
      _id: randomId(),
      username: username.trim(),
      email: normalizedEmail,
      passwordHash,
      profile: { name: name?.trim() || username.trim(), preferences: [] },
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  });
}
