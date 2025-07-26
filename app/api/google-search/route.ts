import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    // Use Google Custom Search API for real-time web data
    const searchResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=5`,
    )

    if (!searchResponse.ok) {
      throw new Error("Google Search API request failed")
    }

    const searchData = await searchResponse.json()
    const items = searchData.items || []

    if (items.length === 0) {
      return NextResponse.json({
        response: `I couldn't find any current information about "${query}" on the web, Sir. Please try a different search term.`,
        sources: [],
      })
    }

    // Format comprehensive response with real-time data
    let response = `Here's the latest information I found about "${query}", Sir:\n\n`

    items.slice(0, 3).forEach((item: any, index: number) => {
      response += `${index + 1}. **${item.title}**\n`
      if (item.snippet) {
        response += `${item.snippet}\n`
      }
      response += `Source: ${item.displayLink}\n\n`
    })

    response += "This information is current as of now. Would you like me to search for more specific details, Sir?"

    return NextResponse.json({
      response,
      sources: items.map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: item.displayLink,
      })),
      totalResults: searchData.searchInformation?.totalResults || 0,
    })
  } catch (error) {
    console.error("Google Search API error:", error)

    // Fallback to ChatGPT for search if Google API fails
    const query = await request.json().then((data) => data.query) // Declare the query variable here
    try {
      const fallbackResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Search and provide the most current, up-to-date information about: ${query}. Include recent developments, current statistics, and latest news. Be comprehensive and detailed.`,
        }),
      })

      const fallbackData = await fallbackResponse.json()
      return NextResponse.json({
        response: fallbackData.response + "\n\n(Note: Using AI knowledge as Google Search is temporarily unavailable)",
        sources: [],
      })
    } catch (fallbackError) {
      return NextResponse.json({
        response: `I apologize, Sir. I'm having trouble accessing real-time web data at the moment. Please try again later.`,
        sources: [],
      })
    }
  }
}
