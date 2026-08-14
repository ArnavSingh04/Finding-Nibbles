import { NextRequest, NextResponse } from "next/server";
import { collections, ensureIndexes } from "@/lib/models";
import { ApiError, handle, requireUserId } from "@/lib/session";

function normalizeTerm(s: string) {
  return s.trim().replace(/\s+/g, " ");
}

/** GET /api/search-history — user's search terms, newest first. */
export async function GET() {
  return handle(async () => {
    const userId = await requireUserId();
    const searchHistory = await collections.searchHistory();
    const items = await searchHistory
      .find({ userId }, { sort: { timestamp: -1 } })
      .toArray();
    return NextResponse.json(items);
  });
}

/** POST /api/search-history — upsert a search term. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { searchTerm } = await req.json();
    if (typeof searchTerm !== "string") throw new ApiError(400, "searchTerm must be a string");

    await ensureIndexes();
    const term = normalizeTerm(searchTerm);
    const now = new Date();
    const searchHistory = await collections.searchHistory();
    await searchHistory.updateOne(
      { userId, searchTerm: term },
      { $setOnInsert: { userId, searchTerm: term, createdAt: now }, $set: { timestamp: now } },
      { upsert: true }
    );
    return NextResponse.json({ ok: 1 });
  });
}

/** DELETE /api/search-history — remove a single search term. */
export async function DELETE(req: NextRequest) {
  return handle(async () => {
    const userId = await requireUserId();
    const { searchTerm } = await req.json();
    if (typeof searchTerm !== "string") throw new ApiError(400, "searchTerm must be a string");

    const searchHistory = await collections.searchHistory();
    const result = await searchHistory.deleteOne({ userId, searchTerm: normalizeTerm(searchTerm) });
    return NextResponse.json({ deletedCount: result.deletedCount ?? 0 });
  });
}
