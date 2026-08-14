import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

/** POST /api/users/profile-image — store a base64 profile image as a data URL. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { name, type, size, data } = await req.json();

    if (!data) throw new ApiError(400, "No file data provided");
    if (!type?.startsWith("image/")) throw new ApiError(400, "File must be an image");
    if (size > 5 * 1024 * 1024) throw new ApiError(400, "File size must be less than 5MB");

    const dataUrl = `data:${type};base64,${data}`;
    const users = await collections.users();
    await users.updateOne({ _id: userId }, { $set: { "profile.profileImage": dataUrl } });

    return NextResponse.json({ success: true, message: "Profile image updated successfully" });
  });
}
