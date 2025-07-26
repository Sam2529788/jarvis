import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json()

    // Extract application name from command
    const appMatch = command.toLowerCase().match(/open|launch|start\s+(\w+)/i)
    const appName = appMatch ? appMatch[1] : "application"

    // Simulate system control (in real implementation, this would use PowerShell)
    const responses = {
      calculator: "Opening Calculator application.",
      notepad: "Launching Notepad for you.",
      chrome: "Starting Google Chrome browser.",
      photoshop: "Launching Adobe Photoshop.",
      default: `Attempting to open ${appName}. Please note that system control is limited in this browser environment.`,
    }

    const response = responses[appName.toLowerCase() as keyof typeof responses] || responses.default

    return NextResponse.json({ response })
  } catch (error) {
    console.error("System control error:", error)
    return NextResponse.json({ response: "I'm unable to execute system commands at the moment." }, { status: 500 })
  }
}
