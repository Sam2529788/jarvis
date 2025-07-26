import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    // Extract topic from query
    let topic = query
      .toLowerCase()
      .replace(/jarvis|news|latest|about|get|me|the|current/g, "")
      .trim()

    if (!topic) {
      topic = "technology" // Default topic
    }

    // Use Google News API via Custom Search
    const newsResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_NEWS_SEARCH_ENGINE_ID}&q=${encodeURIComponent(topic)}&num=5&sort=date`,
    )

    if (!newsResponse.ok) {
      throw new Error("Google News API request failed")
    }

    const newsData = await newsResponse.json()
    const articles = newsData.items || []

    if (articles.length === 0) {
      return NextResponse.json({
        response: `I couldn't find any recent news about "${topic}", Sir. Please try a different topic.`,
        articles: [],
      })
    }

    // Format news response
    let response = `Here are the latest news headlines about ${topic}, Sir:\n\n`

    articles.slice(0, 4).forEach((article: any, index: number) => {
      response += `${index + 1}. **${article.title}**\n`
      if (article.snippet) {
        response += `${article.snippet}\n`
      }
      response += `Source: ${article.displayLink}\n`
      response += `Published: ${new Date().toLocaleDateString()}\n\n`
    })

    response +=
      "These are the most current news stories available. Would you like me to search for news on a different topic, Sir?"

    return NextResponse.json({
      response,
      articles: articles.map((article: any) => ({
        title: article.title,
        url: article.link,
        snippet: article.snippet,
        source: article.displayLink,
        publishedAt: new Date().toISOString(),
      })),
      totalResults: newsData.searchInformation?.totalResults || 0,
    })
  } catch (error) {
    console.error("Google News API error:", error)

    // Fallback to ChatGPT for news
    try {
      const fallbackResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Provide the latest current news and recent developments about: ${topic}. Include recent headlines, key events, current trends, and breaking news. Be comprehensive and up-to-date.`,
        }),
      })

      const fallbackData = await fallbackResponse.json()
      return NextResponse.json({
        response: fallbackData.response + "\n\n(Note: Using AI knowledge as Google News is temporarily unavailable)",
        articles: [],
      })
    } catch (fallbackError) {
      return NextResponse.json({
        response: `I apologize, Sir. I'm having trouble accessing current news data. Please try again later.`,
        articles: [],
      })
    }
  }
}
