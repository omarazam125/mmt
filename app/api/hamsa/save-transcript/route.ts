import { type NextRequest, NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function POST(request: NextRequest) {
  try {
    const { callId, employeeId, employeeName } = await request.json()

    if (!callId || !employeeId || !employeeName) {
      return NextResponse.json({ error: "callId, employeeId, and employeeName are required" }, { status: 400 })
    }

    console.log("[v0] Fetching transcript for call:", callId)

    const hamsaClient = createHamsaClient()
    const jobDetails = await hamsaClient.getJobDetails(callId)

    if (!jobDetails?.data) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 })
    }

    const actualData = jobDetails.data.data || jobDetails.data
    const agentDetails = actualData.agentDetails || {}
    const voiceAgent = agentDetails.voiceAgent || {}

    // Extract transcript from various possible locations
    let transcript = ""
    if (actualData.agentDetails?.voiceAgent?.transcriptionText) {
      transcript = actualData.agentDetails.voiceAgent.transcriptionText
    } else if (actualData.voiceAgent?.transcriptionText) {
      transcript = actualData.voiceAgent.transcriptionText
    } else if (actualData.transcriptionText) {
      transcript = actualData.transcriptionText
    } else if (actualData.transcription) {
      transcript = actualData.transcription
    } else if (actualData.transcript) {
      transcript = actualData.transcript
    }

    const transcriptData = {
      callId,
      employeeId,
      employeeName,
      employeePosition: actualData.params?.employee_position || voiceAgent.params?.employee_position,
      respondentName: actualData.params?.respondent_name || voiceAgent.params?.respondent_name || actualData.toNumber,
      respondentRole: actualData.params?.respondent_role || voiceAgent.params?.respondent_role || "unknown",
      transcript,
      duration: actualData.callDuration || actualData.duration || 0,
      createdAt: actualData.createdAt || new Date().toISOString(),
      status: actualData.status || "completed",
      phoneNumber: actualData.toNumber || actualData.params?.phone_number || "N/A",
    }

    console.log("[v0] Transcript data prepared:", {
      ...transcriptData,
      transcript: transcript.substring(0, 100) + "...",
    })

    return NextResponse.json({
      success: true,
      data: transcriptData,
    })
  } catch (error) {
    console.error("[v0] Error fetching transcript:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch transcript" },
      { status: 500 },
    )
  }
}
