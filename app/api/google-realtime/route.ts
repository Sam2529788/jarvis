import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query, type } = await request.json()

    let response = ""
    const data = {}

    switch (type) {
      case "stock":
        response = await getStockData(query)
        break
      case "crypto":
        response = await getCryptoData(query)
        break
      case "sports":
        response = await getSportsData(query)
        break
      case "traffic":
        response = await getTrafficData(query)
        break
      case "trends":
        response = await getTrendsData(query)
        break
      default:
        response = await getGeneralRealTimeData(query)
    }

    return NextResponse.json({ response, data })
  } catch (error) {
    console.error("Google Real-time API error:", error)
    return NextResponse.json(
      {
        response: "I'm having trouble accessing real-time data at the moment, Sir. Please try again later.",
      },
      { status: 500 },
    )
  }
}

async function getStockData(query: string): Promise<string> {
  try {
    // Extract stock symbol
    const symbol = query.toUpperCase().replace(/[^A-Z]/g, "")

    // Use Google Search to get current stock data
    const searchResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(`${symbol} stock price current real time`)}&num=3`,
    )

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        const stockInfo = searchData.items[0].snippet
        return `Current stock information for ${symbol}, Sir: ${stockInfo}`
      }
    }

    return `I found limited information about ${symbol} stock, Sir. The markets may be closed or the symbol may be incorrect.`
  } catch (error) {
    return `I'm having trouble accessing stock data for ${query}, Sir.`
  }
}

async function getCryptoData(query: string): Promise<string> {
  try {
    const crypto = query.toLowerCase().replace(/[^a-z]/g, "")

    const searchResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(`${crypto} cryptocurrency price current USD real time`)}&num=3`,
    )

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        const cryptoInfo = searchData.items[0].snippet
        return `Current cryptocurrency information for ${crypto.toUpperCase()}, Sir: ${cryptoInfo}`
      }
    }

    return `I found limited information about ${crypto} cryptocurrency, Sir.`
  } catch (error) {
    return `I'm having trouble accessing cryptocurrency data for ${query}, Sir.`
  }
}

async function getSportsData(query: string): Promise<string> {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(`${query} live score current game today`)}&num=3`,
    )

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        const sportsInfo = searchData.items[0].snippet
        return `Current sports information about ${query}, Sir: ${sportsInfo}`
      }
    }

    return `I found limited current sports information about ${query}, Sir.`
  } catch (error) {
    return `I'm having trouble accessing sports data for ${query}, Sir.`
  }
}

async function getTrafficData(query: string): Promise<string> {
  try {
    // Use Google Maps API for traffic data if available
    const searchResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(`${query} traffic conditions current real time`)}&num=3`,
    )

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        const trafficInfo = searchData.items[0].snippet
        return `Current traffic conditions for ${query}, Sir: ${trafficInfo}`
      }
    }

    return `I found limited current traffic information for ${query}, Sir.`
  } catch (error) {
    return `I'm having trouble accessing traffic data for ${query}, Sir.`
  }
}

async function getTrendsData(query: string): Promise<string> {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(`${query} trending now current popular`)}&num=5&sort=date`,
    )

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        let trendsInfo = `Current trends about ${query}, Sir:\n\n`
        searchData.items.slice(0, 3).forEach((item: any, index: number) => {
          trendsInfo += `${index + 1}. ${item.title}\n${item.snippet}\n\n`
        })
        return trendsInfo
      }
    }

    return `I found limited trending information about ${query}, Sir.`
  } catch (error) {
    return `I'm having trouble accessing trending data for ${query}, Sir.`
  }
}

async function getGeneralRealTimeData(query: string): Promise<string> {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(`${query} current real time latest`)}&num=5&sort=date`,
    )

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        let realTimeInfo = `Current real-time information about ${query}, Sir:\n\n`
        searchData.items.slice(0, 3).forEach((item: any, index: number) => {
          realTimeInfo += `${index + 1}. **${item.title}**\n${item.snippet}\nSource: ${item.displayLink}\n\n`
        })
        return realTimeInfo
      }
    }

    return `I found limited current information about ${query}, Sir.`
  } catch (error) {
    return `I'm having trouble accessing real-time data for ${query}, Sir.`
  }
}
