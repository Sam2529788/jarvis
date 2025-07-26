import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// In-memory file storage
const tempFiles = new Map<string, { content: any; type: string }>()

export async function POST(request: NextRequest) {
  try {
    const { query, fileType } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ response: "OpenAI API key is not configured, Sir." }, { status: 500 })
    }

    // Clean and extract topic from query
    const topic = query
      .toLowerCase()
      .replace(/jarvis|create|make|generate|presentation|document|file|ppt|powerpoint|word|excel|pdf/g, "")
      .replace(/about|on|for|the|a|an/g, "")
      .replace(/[^\w\s]/g, "") // Remove special characters
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim()

    if (!topic) {
      return NextResponse.json({
        response: "Please specify what you'd like me to create a file about, Sir.",
      })
    }

    let systemPrompt = ""
    let userPrompt = ""

    switch (fileType) {
      case "ppt":
        systemPrompt = `You are JARVIS, Tony Stark's AI assistant. Create a comprehensive PowerPoint presentation with detailed, professional content. Format your response as valid JSON with this exact structure:
        {
          "title": "Professional Presentation Title",
          "subtitle": "Comprehensive Analysis and Insights",
          "author": "JARVIS AI Assistant",
          "slides": [
            {
              "slideNumber": 1,
              "title": "Title Slide",
              "content": ["Main Title", "Subtitle", "Presented by JARVIS"],
              "notes": "Welcome and introduction notes",
              "layout": "title"
            },
            {
              "slideNumber": 2,
              "title": "Overview",
              "content": ["Key Point 1", "Key Point 2", "Key Point 3", "Key Point 4"],
              "notes": "Overview of the presentation content",
              "layout": "content"
            }
          ]
        }
        Create 10-15 slides with comprehensive content, real-time insights, statistics, and professional formatting. Include title slide, overview, main content slides, and conclusion.`
        userPrompt = `Create a comprehensive PowerPoint presentation about: ${topic}. Include current statistics, real-time insights, market data, and professional analysis.`
        break

      case "word":
        systemPrompt = `You are JARVIS, Tony Stark's AI assistant. Create a comprehensive, well-structured document with professional formatting. Format as valid JSON:
        {
          "title": "Professional Document Title",
          "author": "JARVIS AI Assistant",
          "date": "${new Date().toLocaleDateString()}",
          "sections": [
            {
              "heading": "Executive Summary",
              "content": "Comprehensive executive summary with key insights...",
              "level": 1
            },
            {
              "heading": "Introduction",
              "content": "Detailed introduction with background information...",
              "level": 1
            }
          ]
        }
        Include executive summary, introduction, main sections, analysis, recommendations, and conclusion with current data and insights.`
        userPrompt = `Create a comprehensive Word document about: ${topic}. Include current market data, statistics, analysis, and professional insights.`
        break

      case "excel":
        systemPrompt = `You are JARVIS, Tony Stark's AI assistant. Create a comprehensive spreadsheet with real data, calculations, and analysis. Format as valid JSON:
        {
          "title": "Professional Spreadsheet Analysis",
          "author": "JARVIS AI Assistant",
          "sheets": [
            {
              "name": "Summary",
              "headers": ["Category", "Value", "Percentage", "Trend"],
              "data": [
                ["Item 1", "1000", "25%", "↑"],
                ["Item 2", "800", "20%", "↓"]
              ],
              "formulas": ["=SUM(B:B)", "=AVERAGE(B:B)"]
            }
          ]
        }
        Include multiple sheets with real data, calculations, charts, and professional analysis.`
        userPrompt = `Create a comprehensive Excel spreadsheet about: ${topic}. Include real data, calculations, trends, and professional analysis.`
        break

      case "pdf":
        systemPrompt = `You are JARVIS, Tony Stark's AI assistant. Create a professional report with comprehensive analysis. Format as valid JSON:
        {
          "title": "Professional Analysis Report",
          "author": "JARVIS AI Assistant",
          "date": "${new Date().toLocaleDateString()}",
          "sections": [
            {
              "heading": "Executive Summary",
              "content": "Comprehensive executive summary...",
              "level": 1
            }
          ]
        }
        Include executive summary, analysis, current market data, recommendations, and conclusions.`
        userPrompt = `Create a comprehensive PDF report about: ${topic}. Include current data, market analysis, statistics, and professional recommendations.`
        break

      default:
        return NextResponse.json({
          response:
            "I can create PowerPoint presentations, Word documents, Excel spreadsheets, and PDF reports for you, Sir. Please specify the file type.",
        })
    }

    // Generate content using GPT-4o mini
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 3000,
      temperature: 0.7,
    })

    // Parse the generated content
    let fileContent
    try {
      fileContent = JSON.parse(text)
    } catch (error) {
      // If JSON parsing fails, create a structured fallback
      fileContent = {
        title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} - Professional ${fileType.toUpperCase()} Analysis`,
        author: "JARVIS AI Assistant",
        date: new Date().toLocaleDateString(),
        content: text,
        generated: true,
      }
    }

    // Generate download URL
    const cleanTopic = topic.replace(/[^\w]/g, "_")
    const fileName = `${cleanTopic}_${Date.now()}.${fileType}`
    const downloadUrl = `/api/download-file?file=${encodeURIComponent(fileName)}&type=${fileType}`

    // Store file content
    tempFiles.set(fileName, { content: fileContent, type: fileType })

    const slideCount = fileContent.slides?.length || 0
    const sectionCount = fileContent.sections?.length || 0
    const sheetCount = fileContent.sheets?.length || 0

    let response = `Certainly, Sir. I've created a comprehensive ${fileType.toUpperCase()} file about "${topic}" for you. `

    if (fileType === "ppt") {
      response += `The presentation contains ${slideCount} professionally designed slides with detailed content, current market insights, and statistical analysis. `
    } else if (fileType === "word") {
      response += `The document contains ${sectionCount} detailed sections with comprehensive analysis, current data, and professional insights. `
    } else if (fileType === "excel") {
      response += `The spreadsheet contains ${sheetCount} sheets with real data, calculations, and trend analysis. `
    } else if (fileType === "pdf") {
      response += `The report contains ${sectionCount} comprehensive sections with current market data and professional recommendations. `
    }

    response += `The file is ready for download and fully compatible with Microsoft Office tools. You can access it immediately, Sir.`

    return NextResponse.json({
      response,
      downloadUrl,
      fileName,
      fileContent,
      summary: {
        title: fileContent.title,
        author: fileContent.author || "JARVIS AI Assistant",
        itemCount: slideCount || sectionCount || sheetCount,
        fileSize: `${Math.round(JSON.stringify(fileContent).length / 1024)}KB`,
        format: fileType.toUpperCase(),
      },
    })
  } catch (error) {
    console.error("File creation error:", error)
    return NextResponse.json(
      {
        response:
          "I apologize, Sir. I encountered an error while creating the file. Please try again with a different topic or file type.",
      },
      { status: 500 },
    )
  }
}

export { tempFiles }
