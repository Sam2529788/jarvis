import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Simulate system information (in real implementation, this would use PowerShell)
    const mockSystemInfo = {
      cpu: `${Math.floor(Math.random() * 30) + 10}%`,
      memory: `${(Math.random() * 4 + 6).toFixed(1)}GB`,
      disk: `${Math.floor(Math.random() * 40) + 40}%`,
      uptime: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`,
    }

    const response = `System Status Report: CPU usage is at ${mockSystemInfo.cpu}, memory usage is ${mockSystemInfo.memory}, disk usage is at ${mockSystemInfo.disk}, and system uptime is ${mockSystemInfo.uptime}. All systems are operating within normal parameters.`

    return NextResponse.json({ response })
  } catch (error) {
    console.error("System info error:", error)
    return NextResponse.json({ response: "Unable to retrieve system information at this time." }, { status: 500 })
  }
}
