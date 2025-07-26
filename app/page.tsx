"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Send,
  Keyboard,
  Volume2,
  Cpu,
  Zap,
  Download,
  FileText,
  Pause,
  Play,
  MapPin,
  Wifi,
  Clock,
  Thermometer,
  Database,
  Globe,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

interface Message {
  id: string
  type: "user" | "jarvis"
  content: string
  timestamp: Date
  downloadUrl?: string
  fileName?: string
  sources?: Array<{
    title: string
    url: string
    snippet: string
    source: string
  }>
  summary?: {
    title: string
    author: string
    itemCount: number
    fileSize: string
    format: string
  }
}

interface PausedProcess {
  id: string
  command: string
  type: string
  timestamp: Date
  progress?: string
}

interface SystemStatus {
  cpu: string
  memory: string
  status: string
  uptime: string
  processes: number
  networkLatency: number
}

interface LocationData {
  latitude: number
  longitude: number
  city?: string
  country?: string
  accuracy?: number
  timestamp?: number
}

interface WeatherData {
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  pressure: number
  visibility: number
  uvIndex: number
  lastUpdated: Date
}

interface APIStatus {
  openai: { status: string; latency: number; lastCall: Date | null }
  google: { status: string; latency: number; lastCall: Date | null }
  weather: { status: string; latency: number; lastCall: Date | null }
  location: { status: string; accuracy: number; lastUpdate: Date | null }
  keyboard: { status: string; isActive: boolean; lastInput: Date | null }
}

interface RealTimeMetrics {
  keyboardCommands: number
  filesCreated: number
  searchQueries: number
  interruptions: number
  totalUptime: number
  avgResponseTime: number
  googleSearches: number
  realTimeQueries: number
}

export default function JarvisInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState("")
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cpu: "12%",
    memory: "8.2GB",
    status: "ONLINE",
    uptime: "0h 0m",
    processes: 0,
    networkLatency: 0,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [pausedProcess, setPausedProcess] = useState<PausedProcess | null>(null)
  const [currentProcessController, setCurrentProcessController] = useState<AbortController | null>(null)
  const [userLocation, setUserLocation] = useState<LocationData | null>(null)
  const [locationPermission, setLocationPermission] = useState<string>("prompt")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [apiStatus, setApiStatus] = useState<APIStatus>({
    openai: { status: "idle", latency: 0, lastCall: null },
    google: { status: "idle", latency: 0, lastCall: null },
    weather: { status: "idle", latency: 0, lastCall: null },
    location: { status: "idle", accuracy: 0, lastUpdate: null },
    keyboard: { status: "ready", isActive: true, lastInput: null },
  })
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics>({
    keyboardCommands: 0,
    filesCreated: 0,
    searchQueries: 0,
    interruptions: 0,
    totalUptime: 0,
    avgResponseTime: 0,
    googleSearches: 0,
    realTimeQueries: 0,
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [startTime] = useState(new Date())

  const synthRef = useRef<SpeechSynthesis | null>(null)
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Start real-time updates
    startRealTimeUpdates()

    // Request location permission on load
    requestLocationPermission()

    // Initialize speech synthesis for responses
    synthRef.current = window.speechSynthesis

    // Focus input on load
    if (inputRef.current) {
      inputRef.current.focus()
    }

    // Set keyboard as ready
    setApiStatus((prev) => ({
      ...prev,
      keyboard: { status: "ready", isActive: true, lastInput: null },
    }))

    return () => {
      if (currentUtteranceRef.current && synthRef.current) {
        synthRef.current.cancel()
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
      }
    }
  }, [])

  const startRealTimeUpdates = () => {
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())

      // Update uptime
      const uptime = Date.now() - startTime.getTime()
      const hours = Math.floor(uptime / (1000 * 60 * 60))
      const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))

      setSystemStatus((prev) => ({
        ...prev,
        uptime: `${hours}h ${minutes}m`,
        cpu: `${Math.floor(Math.random() * 20) + 10}%`,
        memory: `${(Math.random() * 2 + 7).toFixed(1)}GB`,
        processes: messages.length,
        networkLatency: Math.floor(Math.random() * 50) + 20,
      }))

      setRealTimeMetrics((prev) => ({
        ...prev,
        totalUptime: uptime,
      }))
    }, 1000)

    // Update weather data every 5 minutes
    const weatherInterval = setInterval(() => {
      if (userLocation) {
        updateWeatherData()
      }
    }, 300000) // 5 minutes

    metricsIntervalRef.current = timeInterval

    return () => {
      clearInterval(timeInterval)
      clearInterval(weatherInterval)
    }
  }

  const updateWeatherData = async () => {
    if (!userLocation) return

    try {
      const startTime = Date.now()
      const response = await fetch("/api/google-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "current weather",
          userLocation: userLocation,
        }),
      })

      const latency = Date.now() - startTime

      if (response.ok) {
        const data = await response.json()
        if (data.weatherData) {
          setWeatherData({
            temperature: data.weatherData.temperature,
            condition: data.weatherData.condition,
            humidity: data.weatherData.humidity || 0,
            windSpeed: data.weatherData.windSpeed || 0,
            pressure: data.weatherData.pressure || 0,
            visibility: data.weatherData.visibility || 0,
            uvIndex: data.weatherData.uvIndex || 0,
            lastUpdated: new Date(),
          })
        }

        setApiStatus((prev) => ({
          ...prev,
          weather: { status: "connected", latency, lastCall: new Date() },
        }))
      }
    } catch (error) {
      setApiStatus((prev) => ({
        ...prev,
        weather: { status: "error", latency: 0, lastCall: new Date() },
      }))
    }
  }

  const requestLocationPermission = async () => {
    if ("geolocation" in navigator) {
      try {
        const startTime = Date.now()
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          })
        })

        const accuracy = position.coords.accuracy
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy,
          timestamp: Date.now(),
        }

        // Get city name from coordinates using Google Maps API
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${locationData.latitude},${locationData.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`,
          )
          if (response.ok) {
            const data = await response.json()
            if (data.results && data.results.length > 0) {
              const addressComponents = data.results[0].address_components
              const cityComponent = addressComponents.find(
                (comp: any) => comp.types.includes("locality") || comp.types.includes("administrative_area_level_1"),
              )
              const countryComponent = addressComponents.find((comp: any) => comp.types.includes("country"))

              locationData.city = cityComponent?.long_name || "Unknown"
              locationData.country = countryComponent?.long_name || "Unknown"
            }
          }
        } catch (error) {
          console.error("Error getting city name:", error)
          // Fallback to reverse geocoding service
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${locationData.latitude}&longitude=${locationData.longitude}&localityLanguage=en`,
            )
            const data = await response.json()
            locationData.city = data.city || data.locality || "Unknown"
            locationData.country = data.countryName || "Unknown"
          } catch (fallbackError) {
            console.error("Fallback geocoding error:", fallbackError)
          }
        }

        setUserLocation(locationData)
        setLocationPermission("granted")

        setApiStatus((prev) => ({
          ...prev,
          location: {
            status: "connected",
            accuracy,
            lastUpdate: new Date(),
          },
        }))

        // Get initial weather data
        updateWeatherData()
      } catch (error) {
        console.error("Error getting location:", error)
        setLocationPermission("denied")
        setApiStatus((prev) => ({
          ...prev,
          location: { status: "error", accuracy: 0, lastUpdate: new Date() },
        }))
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && currentInput.trim()) {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (!currentInput.trim()) return

    const command = currentInput.trim()
    setCurrentInput("")

    // Update keyboard metrics
    setRealTimeMetrics((prev) => ({
      ...prev,
      keyboardCommands: prev.keyboardCommands + 1,
    }))

    setApiStatus((prev) => ({
      ...prev,
      keyboard: { status: "active", isActive: true, lastInput: new Date() },
    }))

    // If currently speaking, interrupt the speech
    if (isSpeaking && synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
      if (currentUtteranceRef.current) {
        currentUtteranceRef.current = null
      }
      setRealTimeMetrics((prev) => ({
        ...prev,
        interruptions: prev.interruptions + 1,
      }))
    }

    // If currently processing, pause the process
    if (isProcessing && currentProcessController) {
      handleProcessInterruption(command)
      return
    }

    processCommand(command)
  }

  const handleProcessInterruption = async (newCommand: string) => {
    if (currentProcessController) {
      currentProcessController.abort()
      setCurrentProcessController(null)
    }

    const currentCommand = messages[messages.length - 1]?.content || "Unknown process"
    const newPausedProcess: PausedProcess = {
      id: Date.now().toString(),
      command: currentCommand,
      type: "interrupted",
      timestamp: new Date(),
      progress: "Paused during processing",
    }
    setPausedProcess(newPausedProcess)
    setIsProcessing(false)

    speak("Process paused, Sir. How may I assist you?")

    const interruptMessage: Message = {
      id: Date.now().toString(),
      type: "jarvis",
      content: `Process paused, Sir. I've temporarily halted the current task: "${currentCommand}". How may I assist you now?`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, interruptMessage])

    if (newCommand) {
      await processCommand(newCommand, true)
      offerToResume()
    }
  }

  const offerToResume = () => {
    if (pausedProcess) {
      const resumeMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "jarvis",
        content: `Sir, I've completed your request. Would you like me to resume the paused process: "${pausedProcess.command}"? Type "resume" or "continue" to proceed.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, resumeMessage])
      speak(`Sir, would you like me to resume the paused process? Type "resume" to continue.`)
    }
  }

  const resumePausedProcess = async () => {
    if (pausedProcess) {
      const resumeMessage: Message = {
        id: Date.now().toString(),
        type: "jarvis",
        content: `Resuming the paused process, Sir: "${pausedProcess.command}"`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, resumeMessage])
      speak("Resuming the paused process, Sir.")

      await processCommand(pausedProcess.command, false, true)
      setPausedProcess(null)
    }
  }

  const speak = async (text: string) => {
    setIsSpeaking(true)

    if (synthRef.current) {
      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85
      utterance.pitch = 0.9
      utterance.volume = 0.8

      const voices = synthRef.current.getVoices()
      const britishVoice = voices.find(
        (voice) => voice.name.includes("British") || voice.name.includes("UK") || voice.lang.includes("en-GB"),
      )
      if (britishVoice) {
        utterance.voice = britishVoice
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        currentUtteranceRef.current = null
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
        currentUtteranceRef.current = null
      }

      currentUtteranceRef.current = utterance
      synthRef.current.speak(utterance)
    }
  }

  const processCommand = async (command: string, isInterruption = false, isResume = false) => {
    if (!command.trim()) return

    const commandStartTime = Date.now()

    // Check for resume commands
    if (command.toLowerCase().includes("resume") || command.toLowerCase().includes("continue")) {
      if (pausedProcess) {
        await resumePausedProcess()
        return
      } else {
        speak("There is no paused process to resume, Sir.")
        return
      }
    }

    // Check for cancel commands
    if (command.toLowerCase().includes("cancel") || command.toLowerCase().includes("stop")) {
      if (pausedProcess) {
        setPausedProcess(null)
        speak("Paused process cancelled, Sir.")
        return
      }
    }

    setIsProcessing(true)

    const controller = new AbortController()
    setCurrentProcessController(controller)

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: command,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      let response = ""
      let downloadUrl = ""
      let fileName = ""
      let summary = undefined
      let sources: any[] = []

      // Determine if this is a real-time query that needs Google APIs
      const isRealTimeQuery =
        command.toLowerCase().includes("current") ||
        command.toLowerCase().includes("latest") ||
        command.toLowerCase().includes("recent") ||
        command.toLowerCase().includes("today") ||
        command.toLowerCase().includes("now") ||
        command.toLowerCase().includes("live") ||
        command.toLowerCase().includes("breaking") ||
        command.toLowerCase().includes("trending") ||
        command.toLowerCase().includes("price") ||
        command.toLowerCase().includes("stock") ||
        command.toLowerCase().includes("crypto") ||
        command.toLowerCase().includes("weather") ||
        command.toLowerCase().includes("news") ||
        command.toLowerCase().includes("traffic") ||
        command.toLowerCase().includes("score") ||
        command.toLowerCase().includes("search for") ||
        command.toLowerCase().includes("google")

      // File creation commands
      if (
        command.toLowerCase().includes("create") ||
        command.toLowerCase().includes("make") ||
        command.toLowerCase().includes("generate")
      ) {
        const result = await handleFileCreation(command, controller.signal)
        if (controller.signal.aborted) return
        response = result.response
        downloadUrl = result.downloadUrl || ""
        fileName = result.fileName || ""
        summary = result.summary

        setRealTimeMetrics((prev) => ({
          ...prev,
          filesCreated: prev.filesCreated + 1,
        }))
      }
      // System control commands
      else if (command.toLowerCase().includes("open") || command.toLowerCase().includes("launch")) {
        response = await handleSystemControl(command, controller.signal)
        if (controller.signal.aborted) return
      }
      // System info commands
      else if (command.toLowerCase().includes("system") || command.toLowerCase().includes("status")) {
        response = await handleSystemInfo(controller.signal)
        if (controller.signal.aborted) return
      }
      // Real-time queries - use Google APIs then process through ChatGPT
      else if (isRealTimeQuery) {
        let googleData = ""
        let googleSources: any[] = []

        try {
          // Determine the type of real-time query
          if (command.toLowerCase().includes("weather")) {
            googleData = await handleGoogleWeather(command, controller.signal)
            if (controller.signal.aborted) return
          } else if (command.toLowerCase().includes("news")) {
            const newsResult = await handleGoogleNews(command, controller.signal)
            if (controller.signal.aborted) return
            googleData = newsResult.response
            googleSources = newsResult.articles || []
          } else if (
            command.toLowerCase().includes("stock") ||
            command.toLowerCase().includes("crypto") ||
            command.toLowerCase().includes("sports") ||
            command.toLowerCase().includes("traffic") ||
            command.toLowerCase().includes("trending")
          ) {
            googleData = await handleRealTimeData(command, controller.signal)
            if (controller.signal.aborted) return

            setRealTimeMetrics((prev) => ({
              ...prev,
              realTimeQueries: prev.realTimeQueries + 1,
            }))
          } else {
            // General search query
            const searchResult = await handleGoogleSearch(command, controller.signal)
            if (controller.signal.aborted) return
            googleData = searchResult.response
            googleSources = searchResult.sources || []

            setRealTimeMetrics((prev) => ({
              ...prev,
              searchQueries: prev.searchQueries + 1,
              googleSearches: prev.googleSearches + 1,
            }))
          }

          // Process Google data through ChatGPT for cleaner response
          const chatResponse = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: `Based on this real-time data I gathered: "${googleData}", please provide a clean, comprehensive, and well-structured response to the user's query: "${command}". Make the response professional, informative, and easy to understand. Include relevant details and insights.`,
            }),
            signal: controller.signal,
          })

          if (controller.signal.aborted) return

          // Check if response is ok before parsing
          if (!chatResponse.ok) {
            throw new Error(`Chat API returned ${chatResponse.status}: ${chatResponse.statusText}`)
          }

          // Check content type
          const contentType = chatResponse.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            const textResponse = await chatResponse.text()
            throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 100)}...`)
          }

          const chatData = await chatResponse.json()
          response = chatData.response || "I apologize, Sir. I received an incomplete response."
          sources = googleSources
        } catch (googleError) {
          console.error("Google API error:", googleError)
          // Fallback to direct ChatGPT if Google APIs fail
          response = await handleDirectChat(command, controller.signal)
          if (controller.signal.aborted) return
        }
      }
      // Normal queries - direct to ChatGPT
      else {
        response = await handleDirectChat(command, controller.signal)
        if (controller.signal.aborted) return
      }

      const responseTime = Date.now() - commandStartTime

      // Update metrics
      setRealTimeMetrics((prev) => ({
        ...prev,
        avgResponseTime: (prev.avgResponseTime + responseTime) / 2,
      }))

      // Update API status
      setApiStatus((prev) => ({
        ...prev,
        openai: {
          status: "connected",
          latency: responseTime,
          lastCall: new Date(),
        },
        google: isRealTimeQuery
          ? {
              status: "connected",
              latency: responseTime,
              lastCall: new Date(),
            }
          : prev.google,
        keyboard: { status: "ready", isActive: true, lastInput: new Date() },
      }))

      const jarvisMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "jarvis",
        content: response,
        timestamp: new Date(),
        downloadUrl: downloadUrl || undefined,
        fileName: fileName || undefined,
        summary: summary || undefined,
        sources: sources.length > 0 ? sources : undefined,
      }
      setMessages((prev) => [...prev, jarvisMessage])

      speak(response)
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Process was interrupted")
        return
      }

      console.error("Command processing error:", error)
      setApiStatus((prev) => ({
        ...prev,
        openai: { ...prev.openai, status: "error" },
        google: { ...prev.google, status: "error" },
      }))

      const errorMessage = `I apologize, Sir. I encountered an error processing your request: ${error.message}. Please try again with a different approach.`
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "jarvis",
          content: errorMessage,
          timestamp: new Date(),
        },
      ])
      speak("I apologize, Sir. I encountered a technical error. Please try again.")
    }

    setIsProcessing(false)
    setCurrentProcessController(null)

    // Refocus input after processing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  // Add this new helper function for direct ChatGPT calls
  const handleDirectChat = async (command: string, signal?: AbortSignal): Promise<string> => {
    const chatResponse = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: command,
      }),
      signal,
    })

    if (signal?.aborted) throw new Error("AbortError")

    // Check if response is ok
    if (!chatResponse.ok) {
      throw new Error(`Chat API returned ${chatResponse.status}: ${chatResponse.statusText}`)
    }

    // Check content type
    const contentType = chatResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await chatResponse.text()
      throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 100)}...`)
    }

    const chatData = await chatResponse.json()
    return chatData.response || "I apologize, Sir. I received an incomplete response."
  }

  const handleGoogleSearch = async (query: string, signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/google-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal,
      })

      if (signal?.aborted) throw new Error("AbortError")

      if (!response.ok) {
        throw new Error(`Google Search API returned ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 100)}...`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Google Search error:", error)
      return {
        response: `I encountered an error searching for "${query}". Please try a different search term.`,
        sources: [],
      }
    }
  }

  const handleGoogleNews = async (query: string, signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/google-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal,
      })

      if (signal?.aborted) throw new Error("AbortError")

      if (!response.ok) {
        throw new Error(`Google News API returned ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 100)}...`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Google News error:", error)
      return {
        response: `I encountered an error fetching news about "${query}". Please try a different topic.`,
        articles: [],
      }
    }
  }

  const handleGoogleWeather = async (query: string, signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/google-weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          userLocation: userLocation,
        }),
        signal,
      })

      if (signal?.aborted) throw new Error("AbortError")

      if (!response.ok) {
        throw new Error(`Weather API returned ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 100)}...`)
      }

      const data = await response.json()
      return data.response || "I couldn't retrieve weather information at this time."
    } catch (error) {
      console.error("Weather API error:", error)
      return "I encountered an error retrieving weather information. Please try again later."
    }
  }

  const handleRealTimeData = async (query: string, signal?: AbortSignal) => {
    try {
      let type = "general"
      if (query.toLowerCase().includes("stock")) type = "stock"
      else if (query.toLowerCase().includes("crypto")) type = "crypto"
      else if (query.toLowerCase().includes("sports")) type = "sports"
      else if (query.toLowerCase().includes("traffic")) type = "traffic"
      else if (query.toLowerCase().includes("trending")) type = "trends"

      const response = await fetch("/api/google-realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, type }),
        signal,
      })

      if (signal?.aborted) throw new Error("AbortError")

      if (!response.ok) {
        throw new Error(`Real-time API returned ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 100)}...`)
      }

      const data = await response.json()
      return data.response || "I couldn't retrieve real-time information at this time."
    } catch (error) {
      console.error("Real-time data error:", error)
      return `I encountered an error retrieving real-time data about "${query}". Please try again later.`
    }
  }

  const handleFileCreation = async (command: string, signal?: AbortSignal) => {
    try {
      let fileType = "word"
      if (
        command.toLowerCase().includes("presentation") ||
        command.toLowerCase().includes("ppt") ||
        command.toLowerCase().includes("powerpoint")
      ) {
        fileType = "ppt"
      } else if (command.toLowerCase().includes("excel") || command.toLowerCase().includes("spreadsheet")) {
        fileType = "excel"
      } else if (command.toLowerCase().includes("pdf") || command.toLowerCase().includes("report")) {
        fileType = "pdf"
      } else if (command.toLowerCase().includes("word") || command.toLowerCase().includes("document")) {
        fileType = "word"
      }

      const response = await fetch("/api/create-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: command, fileType }),
        signal,
      })

      if (signal?.aborted) throw new Error("AbortError")

      if (!response.ok) {
        throw new Error(`File creation API returned ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 100)}...`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("File creation error:", error)
      return {
        response: `I encountered an error creating the file. Please try again with a different request.`,
        downloadUrl: "",
        fileName: "",
        summary: undefined,
      }
    }
  }

  const handleSystemControl = async (command: string, signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/system-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
        signal,
      })

      if (signal?.aborted) throw new Error("AbortError")

      if (!response.ok) {
        throw new Error(`System control API returned ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 100)}...`)
      }

      const data = await response.json()
      return data.response || "System command completed."
    } catch (error) {
      console.error("System control error:", error)
      return "I encountered an error executing the system command. Please try again."
    }
  }

  const handleSystemInfo = async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/system-info", { signal })

      if (signal?.aborted) throw new Error("AbortError")

      if (!response.ok) {
        throw new Error(`System info API returned ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        throw new Error(`Expected JSON response but got: ${textResponse.substring(0, 100)}...`)
      }

      const data = await response.json()
      return data.response || "System information retrieved."
    } catch (error) {
      console.error("System info error:", error)
      return "I encountered an error retrieving system information. Please try again."
    }
  }

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)
    return `${hours}h ${minutes}m ${seconds}s`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header with Real-time Status */}
      <div className="border-b border-blue-500/30 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  J.A.R.V.I.S
                </h1>
                <p className="text-sm text-blue-300">Just A Rather Very Intelligent System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-green-500 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                {systemStatus.status}
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                <Globe className="w-3 h-3 mr-1" />
                Google APIs
              </Badge>
              {pausedProcess && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                  <Pause className="w-3 h-3 mr-1" />
                  Process Paused
                </Badge>
              )}
              {isSpeaking && (
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  <Volume2 className="w-3 h-3 mr-1" />
                  Speaking
                </Badge>
              )}
              {userLocation && (
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  <MapPin className="w-3 h-3 mr-1" />
                  {userLocation.city}
                </Badge>
              )}
              <div className="text-sm text-blue-300">
                <Clock className="w-4 h-4 inline mr-1" />
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Real-time Data Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* System Metrics */}
          <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-300">System Metrics</h3>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>CPU Usage</span>
                  <span>{systemStatus.cpu}</span>
                </div>
                <Progress value={Number.parseInt(systemStatus.cpu)} className="h-1" />
                <div className="flex justify-between text-xs">
                  <span>Memory</span>
                  <span>{systemStatus.memory}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Uptime</span>
                  <span>{systemStatus.uptime}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Processes</span>
                  <span>{systemStatus.processes}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Google API Status */}
          <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-300">Google APIs</h3>
                <Globe className="w-4 h-4 text-green-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Search API</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      apiStatus.google.status === "connected"
                        ? "border-green-500 text-green-400"
                        : apiStatus.google.status === "error"
                          ? "border-red-500 text-red-400"
                          : "border-yellow-500 text-yellow-400"
                    }`}
                  >
                    {apiStatus.google.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Weather</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      apiStatus.weather.status === "connected"
                        ? "border-green-500 text-green-400"
                        : apiStatus.weather.status === "error"
                          ? "border-red-500 text-red-400"
                          : "border-yellow-500 text-yellow-400"
                    }`}
                  >
                    {apiStatus.weather.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Maps API</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      apiStatus.location.status === "connected"
                        ? "border-green-500 text-green-400"
                        : apiStatus.location.status === "error"
                          ? "border-red-500 text-red-400"
                          : "border-yellow-500 text-yellow-400"
                    }`}
                  >
                    {apiStatus.location.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Keyboard</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      apiStatus.keyboard.status === "ready" || apiStatus.keyboard.status === "active"
                        ? "border-green-500 text-green-400"
                        : "border-gray-500 text-gray-400"
                    }`}
                  >
                    {apiStatus.keyboard.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Latency</span>
                  <span>{apiStatus.google.latency}ms</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Real-time Weather */}
          <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-300">Live Weather</h3>
                <Thermometer className="w-4 h-4 text-orange-400" />
              </div>
              {weatherData ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Temperature</span>
                    <span>{weatherData.temperature}°C</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Condition</span>
                    <span className="capitalize">{weatherData.condition}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Humidity</span>
                    <span>{weatherData.humidity}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Wind</span>
                    <span>{weatherData.windSpeed} km/h</span>
                  </div>
                  <div className="text-xs text-blue-300">Updated: {weatherData.lastUpdated.toLocaleTimeString()}</div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">
                  {userLocation ? "Loading weather data..." : "Location required"}
                </div>
              )}
            </div>
          </Card>

          {/* Keyboard Activity Metrics */}
          <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-300">Keyboard Activity</h3>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Search Queries</span>
                  <span>{realTimeMetrics.googleSearches}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Real-time Data</span>
                  <span>{realTimeMetrics.realTimeQueries}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Commands</span>
                  <span>{realTimeMetrics.keyboardCommands}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Files Created</span>
                  <span>{realTimeMetrics.filesCreated}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Avg Response</span>
                  <span>{Math.round(realTimeMetrics.avgResponseTime)}ms</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Network & Location Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-300">Network Status</h3>
                <Wifi className="w-4 h-4 text-green-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Network Latency</span>
                  <span>{systemStatus.networkLatency}ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Google API</span>
                  <span>{apiStatus.google.latency}ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Weather API</span>
                  <span>{apiStatus.weather.latency}ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Connection</span>
                  <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                    Stable
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-300">Location Details</h3>
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              {userLocation ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>City</span>
                    <span>{userLocation.city}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Country</span>
                    <span>{userLocation.country}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Accuracy</span>
                    <span>{userLocation.accuracy}m</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Coordinates</span>
                    <span className="text-xs">
                      {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">Location access denied</div>
              )}
            </div>
          </Card>

          <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-blue-300">Session Info</h3>
                <Database className="w-4 h-4 text-purple-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Session Start</span>
                  <span>{startTime.toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Total Uptime</span>
                  <span>{formatUptime(realTimeMetrics.totalUptime)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Messages</span>
                  <span>{messages.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Status</span>
                  <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Keyboard Input Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-blue-300">Keyboard Interface</h2>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4">
                      <Keyboard className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-blue-300">Type your commands below</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Type your command here..."
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 bg-slate-800/50 border-blue-500/30 text-white placeholder-blue-300/50 focus:border-blue-400"
                        disabled={isProcessing}
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={!currentInput.trim() || isProcessing}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-xs text-blue-300 text-center">Press Enter to send</p>
                  </div>

                  {isProcessing && (
                    <div className="text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-blue-300 text-sm">Processing...</p>
                      <p className="text-xs text-yellow-300 mt-1">Type a new command to interrupt</p>
                    </div>
                  )}

                  {isSpeaking && (
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 mb-2">
                        <div className="w-2 h-4 bg-purple-400 animate-pulse"></div>
                        <div className="w-2 h-6 bg-purple-400 animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-4 bg-purple-400 animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                      <p className="text-purple-300 text-sm">Speaking...</p>
                      <p className="text-xs text-yellow-300 mt-1">Type a new command to interrupt</p>
                    </div>
                  )}

                  {pausedProcess && (
                    <div className="bg-yellow-900/30 rounded-lg p-3 border border-yellow-500/30">
                      <div className="flex items-center space-x-2 mb-2">
                        <Pause className="w-4 h-4 text-yellow-400" />
                        <p className="text-sm text-yellow-300">Paused Process</p>
                      </div>
                      <p className="text-xs text-yellow-200">{pausedProcess.command}</p>
                      <div className="mt-2 space-x-2">
                        <Button
                          size="sm"
                          onClick={() => resumePausedProcess()}
                          className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPausedProcess(null)}
                          className="text-xs border-red-500 text-red-400 hover:bg-red-900/20"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-semibold text-blue-300">Example Commands:</h3>
                  <div className="text-xs text-blue-200 space-y-1">
                    <p className="text-yellow-300 font-medium">Real-time Queries (Google + ChatGPT):</p>
                    <p>• "latest AI news today"</p>
                    <p>• "current weather outside"</p>
                    <p>• "trending topics now"</p>
                    <p>• "Bitcoin price today"</p>
                    <p>• "search for recent developments in quantum computing"</p>
                    <p className="text-green-300 font-medium mt-2">Normal Queries (ChatGPT only):</p>
                    <p>• "explain quantum physics"</p>
                    <p>• "how does machine learning work?"</p>
                    <p>• "write a poem about technology"</p>
                    <p>• "what is artificial intelligence?"</p>
                    <p className="text-blue-300 font-medium mt-2">File Creation & System:</p>
                    <p>• "create presentation about space"</p>
                    <p>• "system status"</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-black/40 border-blue-500/30 backdrop-blur-sm h-[600px] flex flex-col">
              <div className="p-4 border-b border-blue-500/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-blue-300">Conversation with JARVIS</h2>
                  <div className="flex items-center space-x-2">
                    {pausedProcess && (
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <Pause className="w-4 h-4" />
                        <span className="text-sm">Process Paused</span>
                      </div>
                    )}
                    {isSpeaking && (
                      <div className="flex items-center space-x-2 text-purple-400">
                        <Volume2 className="w-4 h-4" />
                        <span className="text-sm">Speaking</span>
                      </div>
                    )}
                    <div className="text-xs text-blue-300">{realTimeMetrics.googleSearches} Google searches</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-blue-300 mt-20">
                    <Keyboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Good day, Sir. All systems are online and ready for keyboard input.</p>
                    <p className="text-sm mt-2">
                      I can access live web data, current news, real-time weather, stock prices, and trending topics.
                    </p>
                    <p className="text-xs mt-2 text-yellow-300">
                      Type your commands in the input field to get started!
                    </p>
                    {userLocation && weatherData && (
                      <div className="mt-4 p-3 bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-green-300">
                          📍 {userLocation.city}: {weatherData.temperature}°C, {weatherData.condition}
                        </p>
                        <p className="text-xs text-blue-300">
                          💨 Wind: {weatherData.windSpeed} km/h | 💧 Humidity: {weatherData.humidity}%
                        </p>
                        <p className="text-xs text-gray-300">🌐 Powered by Google APIs for real-time accuracy</p>
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-blue-100"
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">{message.type === "user" ? "You" : "JARVIS"}</p>
                        <p className="whitespace-pre-wrap">{message.content}</p>

                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-900/30 rounded border border-blue-500/30">
                            <div className="flex items-center space-x-2 mb-2">
                              <Globe className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-semibold text-blue-300">Real-time Sources</span>
                            </div>
                            <div className="space-y-2">
                              {message.sources.slice(0, 3).map((source, index) => (
                                <div key={index} className="text-xs">
                                  <p className="text-blue-300 font-medium">{source.title}</p>
                                  <p className="text-gray-300">{source.snippet?.substring(0, 100)}...</p>
                                  <p className="text-blue-400">Source: {source.source}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {message.summary && (
                          <div className="mt-3 p-3 bg-blue-900/30 rounded border border-blue-500/30">
                            <div className="flex items-center space-x-2 mb-2">
                              <FileText className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-semibold text-blue-300">File Summary</span>
                            </div>
                            <div className="text-xs space-y-1">
                              <p>
                                <span className="text-blue-300">Title:</span> {message.summary.title}
                              </p>
                              <p>
                                <span className="text-blue-300">Author:</span> {message.summary.author}
                              </p>
                              <p>
                                <span className="text-blue-300">Content:</span> {message.summary.itemCount} items
                              </p>
                              <p>
                                <span className="text-blue-300">Size:</span> {message.summary.fileSize}
                              </p>
                              <p>
                                <span className="text-blue-300">Format:</span> {message.summary.format}
                              </p>
                            </div>
                          </div>
                        )}

                        {message.downloadUrl && (
                          <div className="mt-3">
                            <a
                              href={message.downloadUrl}
                              download={message.fileName}
                              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download {message.fileName}</span>
                            </a>
                            <p className="text-xs text-blue-300 mt-1">Compatible with Microsoft Office</p>
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
