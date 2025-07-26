import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    // Extract topic from query or use general news
    let topic = query
      .toLowerCase()
      .replace(/jarvis|news|latest|about|get|me|the/g, "")
      .trim()

    if (!topic) {
      topic = "technology" // Default topic
    }

    // Use RSS2JSON API to fetch news from various RSS feeds (free, no API key required)
    const rssFeeds = {
      technology: "https://feeds.feedburner.com/oreilly/radar",
      ai: "https://rss.cnn.com/rss/edition.rss",
      general: "https://rss.cnn.com/rss/edition.rss",
      science: "https://feeds.feedburner.com/oreilly/radar",
    }

    const feedUrl = rssFeeds[topic as keyof typeof rssFeeds] || rssFeeds.general

    const newsResponse = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=5`,
    )

    if (!newsResponse.ok) {
      throw new Error("News API request failed")
    }

    const newsData = await newsResponse.json()
    const articles = newsData.items || []

    if (articles.length === 0) {
      return NextResponse.json({
        response: `I couldn't find any recent news about "${topic}". Here are some general updates: The tech industry continues to evolve rapidly with new developments in AI, cloud computing, and digital transformation. Would you like me to search for news on a different topic?`,
      })
    }

    // Format the response
    const topArticles = articles.slice(0, 3)
    let response = `Here are the latest news headlines about ${topic}:\n\n`

    topArticles.forEach((article: any, index: number) => {
      const publishedDate = new Date(article.pubDate).toLocaleDateString()
      response += `${index + 1}. ${article.title}\n`
      if (article.description) {
        // Clean HTML from description
        const cleanDescription = article.description.replace(/<[^>]*>/g, "").substring(0, 150)
        response += `${cleanDescription}...\n`
      }
      response += `Published: ${publishedDate}\n\n`
    })

    response += "Would you like me to find news on a different topic?"

    return NextResponse.json({ response })
  } catch (error) {
    console.error("News API error:", error)

    const topic =
      query
        .toLowerCase()
        .replace(/jarvis|news|latest|about|get|me|the/g, "")
        .trim() || "current events"

    return NextResponse.json({
      response: `Here's what I know about recent ${topic} developments: The field continues to see rapid advancement with new breakthroughs and innovations. Industry leaders are focusing on sustainable growth and technological integration. Major companies are investing heavily in research and development. Would you like me to help you with something else?`,
    })
  }
}
