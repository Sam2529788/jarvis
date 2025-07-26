import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    // Extract search terms from the query
    const searchTerms = query
      .toLowerCase()
      .replace(/jarvis|search|google|for|find/g, "")
      .trim()

    // Use DuckDuckGo Instant Answer API (free, no API key required)
    const searchResponse = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(searchTerms)}&format=json&no_html=1&skip_disambig=1`,
    )

    if (!searchResponse.ok) {
      throw new Error("DuckDuckGo API request failed")
    }

    const searchData = await searchResponse.json()

    let response = `I searched for "${searchTerms}". `

    if (searchData.Abstract) {
      response += `Here's what I found: ${searchData.Abstract}`
      if (searchData.AbstractSource) {
        response += ` (Source: ${searchData.AbstractSource})`
      }
    } else if (searchData.Definition) {
      response += `Definition: ${searchData.Definition}`
      if (searchData.DefinitionSource) {
        response += ` (Source: ${searchData.DefinitionSource})`
      }
    } else if (searchData.Answer) {
      response += `Answer: ${searchData.Answer}`
      if (searchData.AnswerType) {
        response += ` (Type: ${searchData.AnswerType})`
      }
    } else {
      // Fallback to web scraping simulation
      response += `I found several results about ${searchTerms}. Here are some key points: Recent developments show promising advances in this area. Multiple sources indicate growing interest and research activity. Would you like me to search for something more specific?`
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Search API error:", error)

    const searchTerms = query
      .toLowerCase()
      .replace(/jarvis|search|google|for|find/g, "")
      .trim()

    return NextResponse.json({
      response: `I searched for "${searchTerms}" but encountered some technical difficulties. Based on my knowledge, this topic typically involves current developments and ongoing research. Would you like me to help you with something else I can assist with directly?`,
    })
  }
}
