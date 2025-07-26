import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ response: "OpenAI API key is not configured, Sir." }, { status: 500 })
    }

    console.log("Processing message for Mr. Stark:", message)

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      system: `You are JARVIS, Tony Stark's sophisticated AI assistant from Iron Man. You are highly intelligent, professional, and always address Tony as "Sir" or "Mr. Stark". You have a slight British accent in your personality and speak with refined eloquence. 

You provide comprehensive, detailed responses with professional analysis. You are capable of technical explanations, creative tasks, problem-solving, and general knowledge queries. Always maintain a respectful, professional tone while being helpful and informative.

When processing real-time data from external sources, synthesize the information into clear, well-structured responses that are easy to understand. Focus on the most relevant and important information while maintaining accuracy.

For general knowledge queries, provide detailed explanations based on your training data. For creative tasks, be imaginative while maintaining professionalism.`,
      prompt: message,
      maxTokens: 1000,
      temperature: 0.7,
    })

    console.log("JARVIS response for Mr. Stark:", text)

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        response: `I apologize, Sir. I'm experiencing technical difficulties at the moment. Error: ${error.message}. Please allow me a moment to recalibrate my systems.`,
      },
      { status: 500 },
    )
  }
}
