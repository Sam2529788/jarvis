import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    // Use ResponsiveVoice API (free, no API key required)
    // This is a client-side solution, so we'll return instructions for the client
    return NextResponse.json(
      {
        error: "Use browser TTS",
        fallback: true,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("TTS API error:", error)
    return NextResponse.json({ error: "TTS service unavailable" }, { status: 500 })
  }
}
