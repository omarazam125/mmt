import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { employee, contacts } = body

    // Prepare data to send to webhook
    const webhookData = {
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
      },
      contacts: contacts.map((contact: any) => ({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || "", // Include contact email
        role: contact.role,
        language: contact.language,
      })),
      timestamp: new Date().toISOString(),
    }

    console.log("[v0] Sending notification to webhook:", webhookData)

    // Send to n8n webhook
    const webhookUrl = "https://n8n.srv1022179.hstgr.cloud/webhook/9a8c1a0b-4c59-4b9f-a92e-8c927563556e"
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    })

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`)
    }

    const result = await response.json()
    console.log("[v0] Webhook response:", result)

    return NextResponse.json({
      success: true,
      message: "Email notification sent successfully",
    })
  } catch (error) {
    console.error("[v0] Error sending notification:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send notification",
      },
      { status: 500 },
    )
  }
}
