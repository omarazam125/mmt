import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const report = await request.json()

    console.log("[v0] Saving complete report to localStorage:", {
      id: report.id,
      customerName: report.customerName,
      phoneNumber: report.phoneNumber,
      duration: report.duration,
      status: report.status,
    })

    // This API now just returns success since all storage is handled client-side
    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    console.error("[v0] Error in save report API:", error)
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
  }
}
