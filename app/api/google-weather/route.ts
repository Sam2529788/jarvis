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

    let weatherData

    if (latitude && longitude) {
      // Use Google Maps Geocoding API to get detailed location info
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
      )

      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json()
        if (geocodeData.results && geocodeData.results.length > 0) {
          const addressComponents = geocodeData.results[0].address_components
          const cityComponent = addressComponents.find(
            (comp: any) => comp.types.includes("locality") || comp.types.includes("administrative_area_level_1"),
          )
          if (cityComponent) {
            location = cityComponent.long_name
          }
        }
      }
    } else {
      // Geocode the location using Google Maps API
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
      )

      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json()
        if (geocodeData.results && geocodeData.results.length > 0) {
          const result = geocodeData.results[0]
          latitude = result.geometry.location.lat
          longitude = result.geometry.location.lng
          location = result.formatted_address
        }
      }
    }

    if (!latitude || !longitude) {
      return NextResponse.json({
        response: `I couldn't find location data for ${location}, Sir. Could you specify a different city or region?`,
      })
    }

    // Use OpenWeatherMap API with Google-enhanced location data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
    )

    if (!weatherResponse.ok) {
      // Fallback to Open-Meteo if OpenWeatherMap fails
      const fallbackResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`,
      )

      if (!fallbackResponse.ok) {
        throw new Error("Weather API request failed")
      }

      const fallbackData = await fallbackResponse.json()
      const current = fallbackData.current_weather
      const hourly = fallbackData.hourly

      weatherData = {
        temperature: Math.round(current.temperature),
        condition: getWeatherCondition(current.weathercode),
        humidity: hourly.relative_humidity_2m ? Math.round(hourly.relative_humidity_2m[0]) : null,
        windSpeed: Math.round(current.windspeed),
        pressure: hourly.pressure_msl ? Math.round(hourly.pressure_msl[0]) : null,
        visibility: null,
        uvIndex: null,
      }
    } else {
      const data = await weatherResponse.json()
      weatherData = {
        temperature: Math.round(data.main.temp),
        condition: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        pressure: data.main.pressure,
        visibility: data.visibility ? Math.round(data.visibility / 1000) : null,
        uvIndex: null, // Would need separate UV API call
      }
    }

    // Get additional real-time data using Google Search
    const searchQuery = `current weather conditions ${location} today real time`
    const searchResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=3`,
    )

    let additionalInfo = ""
    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        const weatherSnippet = searchData.items[0].snippet
        if (weatherSnippet && weatherSnippet.length > 0) {
          additionalInfo = `\n\nAdditional current conditions: ${weatherSnippet}`
        }
      }
    }

    // Compose comprehensive response
    let response = `Current weather ${location === "your location" ? "at your location" : `in ${location}`}, Sir: ${weatherData.temperature}°C with ${weatherData.condition}. `

    if (weatherData.humidity) response += `Humidity is ${weatherData.humidity}%. `
    if (weatherData.windSpeed) response += `Wind speed is ${weatherData.windSpeed} km/h. `
    if (weatherData.pressure) response += `Atmospheric pressure is ${weatherData.pressure} hPa. `
    if (weatherData.visibility) response += `Visibility is ${weatherData.visibility} km. `

    // Weather advice
    if (weatherData.temperature < 0) response += "It's freezing - I recommend bundling up, Sir."
    else if (weatherData.temperature > 30) response += "It's quite hot - please stay hydrated, Sir."
    else if (weatherData.condition.includes("rain")) response += "You might want to take an umbrella, Sir."
    else if (weatherData.condition.includes("clear") || weatherData.condition.includes("sunny"))
      response += "Perfect weather for outdoor activities, Sir."

    response += additionalInfo

    return NextResponse.json({
      response,
      weatherData: {
        ...weatherData,
        location,
        coordinates: { latitude, longitude },
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Google Weather API error:", error)
    return NextResponse.json(
      {
        response:
          "I'm having trouble retrieving current weather data, Sir. Please try again later or ask about a different location.",
      },
      { status: 500 },
    )
  }
}

function getWeatherCondition(code: number): string {
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
  return codeMap[code] ?? "unusual conditions"
}
