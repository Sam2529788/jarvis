import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query, userLocation } = await request.json()

    let location = query
    let latitude = null
    let longitude = null

    // If user location is provided and no specific location in query, use user's location
    if (userLocation && (!query || query.toLowerCase().includes("outside") || query.toLowerCase().includes("here"))) {
      latitude = userLocation.latitude
      longitude = userLocation.longitude
      location = userLocation.city || "your location"
    } else {
      // Extract location from the spoken query
      location = query
        .toLowerCase()
        .replace(/jarvis|weather|what'?s|the|in|for|current|today|outside|here/g, "")
        .replace(/[^\w\s]/g, "")
        .trim()

      if (!location) location = "New York"
    }

    let geoData

    if (latitude && longitude) {
      // Use provided coordinates
      geoData = {
        results: [
          {
            latitude,
            longitude,
            name: location,
            country_code: userLocation?.country || "Unknown",
          },
        ],
      }
    } else {
      // Geocode the location
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
        { headers: { "User-Agent": "JARVIS-Assistant/1.0" } },
      )

      if (!geoRes.ok) throw new Error("Geocoding request failed")
      geoData = await geoRes.json()
    }

    if (!geoData.results || geoData.results.length === 0) {
      return NextResponse.json({
        response: `I couldn't find weather data for ${location}, Sir. Could you specify a different city or region?`,
      })
    }

    const { latitude: lat, longitude: lon, name: cityName, country_code: country } = geoData.results[0]

    // Fetch current weather
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`,
      { headers: { "User-Agent": "JARVIS-Assistant/1.0" } },
    )

    if (!weatherRes.ok) throw new Error("Weather API request failed")

    const weatherData = await weatherRes.json()
    const current = weatherData.current_weather
    const hourly = weatherData.hourly

    const temperature = Math.round(current.temperature)
    const windSpeed = Math.round(current.windspeed)
    const condition = current.weathercode
    const humidity = hourly.relative_humidity_2m ? Math.round(hourly.relative_humidity_2m[0]) : null

    // Weather code mapping
    const codeMap: Record<number, string> = {
      0: "clear sky",
      1: "mainly clear",
      2: "partly cloudy",
      3: "overcast",
      45: "fog",
      48: "depositing rime fog",
      51: "light drizzle",
      53: "moderate drizzle",
      55: "dense drizzle",
      61: "slight rain",
      63: "moderate rain",
      65: "heavy rain",
      71: "slight snow",
      73: "moderate snow",
      75: "heavy snow",
      95: "thunderstorm",
    }

    const description = codeMap[condition as number] ?? "unusual conditions"

    // Compose response
    let response = `Current weather ${location === "your location" ? "at your location" : `in ${cityName}, ${country}`}, Sir: ${temperature}°C with ${description}. `
    response += `Wind speed is ${windSpeed} km/h`
    if (humidity) response += ` and humidity is ${humidity}%`
    response += ". "

    // Weather advice
    if (temperature < 0) response += "It's freezing outside - I recommend bundling up, Sir."
    else if (temperature > 30) response += "It's quite hot - please stay hydrated, Sir."
    else if (description.includes("rain")) response += "You might want to take an umbrella, Sir."
    else if (description.includes("clear")) response += "Perfect weather for outdoor activities, Sir."

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      {
        response:
          "I'm having trouble retrieving weather data at the moment, Sir. Please try again later or ask about a different location.",
      },
      { status: 500 },
    )
  }
}
