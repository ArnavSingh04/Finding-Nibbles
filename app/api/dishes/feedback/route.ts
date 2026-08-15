import { NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { handle, requireUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** GET /api/dishes/feedback - likes, dislikes and recent searches for AI context. */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const dishSwipes = await collections.dishSwipes();
    const searchHistory = await collections.searchHistory();

    const [likes, dislikes, searches] = await Promise.all([
      dishSwipes.find({ userId, liked: true }, { sort: { createdAt: -1 }, limit: 100 }).toArray(),
      dishSwipes.find({ userId, liked: false }, { sort: { createdAt: -1 }, limit: 100 }).toArray(),
      searchHistory.find({ userId }, { sort: { timestamp: -1 }, limit: 50 }).toArray(),
    ]);

    return NextResponse.json({
      likes: [...new Set(likes.map((d) => d.name))],
      dislikes: [...new Set(dislikes.map((d) => d.name))],
      recentSearches: [...new Set(searches.map((s) => s.searchTerm))],
    });
  });
}
