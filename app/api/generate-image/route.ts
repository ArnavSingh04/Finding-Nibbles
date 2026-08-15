import { NextRequest, NextResponse } from "next/server";
import { MOCK_DISHES } from "@/lib/mockData";

export const runtime = "nodejs";
export const maxDuration = 30;

async function querySDXL(data: unknown, token: string): Promise<string> {
  const response = await fetch("https://router.huggingface.co/nscale/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Hugging Face Error: ${await response.text()}`);
  }
  const result = (await response.json()) as { data?: Array<{ b64_json?: string }> };
  return result.data?.[0]?.b64_json || "";
}

function fallbackImage(): string {
  return MOCK_DISHES[Math.floor(Math.random() * MOCK_DISHES.length)].imageUrl;
}

/** POST /api/generate-image - SDXL image generation with mock fallback. */
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      return NextResponse.json({ error: "Hugging Face token not configured." }, { status: 500 });
    }

    const imageBase64 = await querySDXL(
      { prompt, model: "stabilityai/stable-diffusion-xl-base-1.0", response_format: "b64_json" },
      hfToken
    );

    if (!imageBase64) {
      console.warn("generate-image: using fallback mock image");
      return NextResponse.json({ imageUrl: fallbackImage() });
    }
    return NextResponse.json({ image: imageBase64 });
  } catch (error) {
    console.error("generate-image error:", error);
    return NextResponse.json({ imageUrl: fallbackImage() });
  }
}
