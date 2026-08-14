import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/lib/models";
import { getUserId } from "@/lib/session";
import { getGeminiModel } from "@/lib/gemini";
import { MOCK_DISHES, MOCK_OCCASION_MENU } from "@/lib/mockData";

export const runtime = "nodejs";
export const maxDuration = 30;

function parsePreferences(preferences?: string | string[]): string[] {
  if (!preferences) return [];
  if (Array.isArray(preferences)) return preferences;
  try {
    const parsed = JSON.parse(preferences);
    return Array.isArray(parsed) ? parsed : [preferences];
  } catch {
    return [preferences];
  }
}

/** POST /api/ai-suggestion — personalised dish / occasion-menu suggestions. */
export async function POST(req: NextRequest) {
  let mode: string | undefined;
  try {
    const body = await req.json();
    const { occasion, preferences, feedback, diversity, avoid, diningMode, vibe } = body;
    mode = body.mode;
    const parsedPreferences = parsePreferences(preferences);

    // Enrich with server-side feedback + avoid list from the signed-in user.
    let userFeedback = feedback;
    let serverAvoid: string[] = [];
    try {
      const resolvedUserId = body.userId || (await getUserId());
      if (resolvedUserId) {
        const dishSwipes = await collections.dishSwipes();
        const searchHistory = await collections.searchHistory();
        const [likesDocs, dislikesDocs, recentSwipesDocs, searches] = await Promise.all([
          dishSwipes.find({ userId: resolvedUserId, liked: true }, { sort: { createdAt: -1 }, limit: 100 }).toArray(),
          dishSwipes.find({ userId: resolvedUserId, liked: false }, { sort: { createdAt: -1 }, limit: 100 }).toArray(),
          dishSwipes.find({ userId: resolvedUserId }, { sort: { createdAt: -1 }, limit: 200 }).toArray(),
          searchHistory.find({ userId: resolvedUserId }, { sort: { timestamp: -1 }, limit: 50 }).toArray(),
        ]);
        const likes = Array.from(new Set(likesDocs.map((d) => d.name)));
        const dislikes = Array.from(new Set(dislikesDocs.map((d) => d.name)));
        const recentSearches = Array.from(new Set(searches.map((s) => s.searchTerm)));
        if (!userFeedback) userFeedback = { likes, dislikes, recentSearches };
        serverAvoid = Array.from(new Set(recentSwipesDocs.map((d) => d.name)));
      }
    } catch {
      console.warn("ai-suggestion: could not load user feedback; proceeding with provided params.");
    }

    const constraints = [
      "Return ONLY valid JSON array of up to 5 items.",
      'Each item must have keys "name" and "description".',
      "No markdown, no code fences, no extra commentary.",
      "Do NOT include tokens, IDs, counters, tags, or suffixes in names; names must be plain dish names.",
      "Prefer variety: cuisines, cooking methods, proteins, and flavor profiles should vary.",
      "Avoid near-duplicates, generic names, or overused classics unless expressly aligned with likes.",
    ].join(" ");

    const systemPreamble =
      "You are a culinary recommender system that personalizes dish suggestions for users based on their preferences and feedback.";

    const contextBlocks: string[] = [];
    const likesList = (userFeedback?.likes || []).slice(0, 30);
    const dislikesList = (userFeedback?.dislikes || []).slice(0, 30);
    const searchesList = (userFeedback?.recentSearches || []).slice(0, 20);
    if (likesList.length) contextBlocks.push(`User liked dishes: ${likesList.join(", ")}`);
    if (dislikesList.length) contextBlocks.push(`User disliked dishes: ${dislikesList.join(", ")}`);
    if (searchesList.length) contextBlocks.push(`Recent searches: ${searchesList.join(", ")}`);
    if (parsedPreferences.length) contextBlocks.push(`Explicit preferences: ${parsedPreferences.join(", ")}`);
    contextBlocks.push(`User feedback (JSON): ${JSON.stringify({ liked: likesList, disliked: dislikesList })}`);

    const avoidList = Array.from(
      new Set([...(Array.isArray(avoid) ? avoid : []), ...serverAvoid])
    ).slice(0, 100);
    if (avoidList.length) {
      contextBlocks.push(`Avoid recommending these dishes (already suggested/seen): ${avoidList.join(", ")}`);
    }

    const modeLine =
      mode === "tryNew"
        ? "Emphasize novelty and diversity across cuisines, textures, and cooking methods. Avoid overfitting to prior likes; include at least one surprise pick."
        : mode === "recommended"
          ? "Emphasize alignment with liked dishes and adjacent cuisines; avoid items similar to dislikes."
          : "Craft a cohesive special-occasion menu tailored to the event.";

    const diversityValue = typeof diversity === "number" ? Math.max(0, Math.min(100, diversity)) : undefined;
    let diversityLine = "";
    if (diversityValue !== undefined) {
      if (diversityValue <= 30) diversityLine = "Diversity=LOW (0-30): Minimize novelty; prefer close neighbors to liked dishes and familiar cuisines.";
      else if (diversityValue <= 70) diversityLine = "Diversity=MEDIUM (31-70): Balance alignment with 1-2 novel picks; include adjacent cuisines and styles.";
      else diversityLine = "Diversity=HIGH (71-100): Maximize novelty and variety; include 2-3 surprising picks dissimilar to recent likes across multiple cuisines and methods.";
    }
    const diversityPolicy =
      diversityValue && diversityValue >= 60
        ? "Ensure the list spans at least 3 distinct cuisines and varied cooking methods. Include at least one regional specialty."
        : "Ensure at least 2 distinct cuisines and avoid repeating the same core ingredient more than twice.";

    const occasionLine = mode === "occasion" && occasion ? `Occasion: ${occasion}.` : "";
    const diningLine = mode === "occasion" && diningMode ? `Dining mode: ${diningMode === "out" ? "Dining out" : "At home"}.` : "";
    const vibeLine = mode === "occasion" && vibe ? `Vibe preference: ${vibe}.` : "";

    const finalPrompt = [
      systemPreamble,
      modeLine,
      diversityLine,
      diversityPolicy,
      occasionLine,
      diningLine,
      vibeLine,
      constraints,
      ...contextBlocks,
      mode === "occasion"
        ? 'Return JSON object with EXACT structure: {"centerpiece":{"name":"Dish Name","description":"Dish description"},"complements":[{"name":"Complement 1","description":"Description 1"},{"name":"Complement 2","description":"Description 2"}]}. The centerpiece is the main dish for the occasion. Complements are supporting dishes. All name and description fields are REQUIRED strings. Cohesive menu; respect dislikes; avoid repeats.'
        : 'Output example: [{"name":"Margherita Pizza","description":"A classic Neapolitan pizza..."}]. Prefer common but authentic dishes where appropriate.',
    ].join("\n");

    const model = getGeminiModel();
    const result = await model.generateContent(finalPrompt);
    const rawText = result.response.text() || "No suggestion generated.";

    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const sanitize = (d: any) => {
      if (!d || typeof d.name !== "string" || typeof d.description !== "string") return null;
      const name = String(d.name).trim().replace(/\s*\d{2,}[a-z]{1,3}$/i, "");
      return { name, description: String(d.description).trim() };
    };

    if (mode === "occasion") {
      const centerpiece = sanitize(parsed?.centerpiece);
      const complements = (Array.isArray(parsed?.complements) ? parsed.complements : [])
        .map(sanitize)
        .filter(Boolean)
        .slice(0, 3);
      if (!centerpiece) throw new Error("Invalid centerpiece");
      return NextResponse.json({ menu: { centerpiece, complements } });
    }

    const baseItems = (Array.isArray(parsed) ? parsed : [parsed]).map(sanitize).filter(Boolean) as {
      name: string;
      description: string;
    }[];
    const seen = new Set<string>();
    const deduped = baseItems.filter((d) => {
      const key = d.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    for (let i = deduped.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deduped[i], deduped[j]] = [deduped[j], deduped[i]];
    }
    const items = deduped.slice(0, 5);
    if (!items.length) throw new Error("No valid items");
    return NextResponse.json({ dishes: items });
  } catch (error) {
    // Graceful fallback to mock data (mirrors the original behaviour).
    console.error("ai-suggestion error:", error);
    if (mode === "occasion") return NextResponse.json({ menu: MOCK_OCCASION_MENU });
    return NextResponse.json({ dishes: MOCK_DISHES });
  }
}
