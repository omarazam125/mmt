import { type NextRequest, NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function POST(request: NextRequest) {
  try {
    const { employeeId, employeeName, callIds, transcripts } = await request.json()

    console.log("[v0] Generating full evaluation for:", employeeName)
    console.log("[v0] Call IDs:", callIds)

    if (!employeeId || !employeeName) {
      return NextResponse.json({ error: "Employee ID and name are required" }, { status: 400 })
    }

    if (!callIds || callIds.length === 0) {
      return NextResponse.json({ error: "At least one call ID is required" }, { status: 400 })
    }

    // First try to get transcripts from provided data
    console.log("[v0] Checking provided data for transcripts...")
    let callTranscripts: any[] = []

    if (transcripts && transcripts.length > 0) {
      console.log("[v0] Found transcripts in provided data")
      callTranscripts = transcripts
    } else {
      console.log("[v0] No transcripts found in provided data, fetching from Hamsa API...")
      const hamsaClient = createHamsaClient()

      // This returns the same structure as the transcripts page uses
      try {
        // Fetch detailed data for each call separately
        const jobDetailsPromises = callIds.map((callId: string) =>
          hamsaClient.getJobDetails(callId).catch((err) => {
            console.error(`[v0] Failed to fetch details for call ${callId}:`, err)
            return null
          }),
        )

        const jobDetailsResults = await Promise.all(jobDetailsPromises)
        console.log(`[v0] Fetched details for ${jobDetailsResults.filter(Boolean).length}/${callIds.length} calls`)

        callTranscripts = jobDetailsResults.map((response, index) => {
          if (!response) {
            console.log(`[v0] No response for call ${callIds[index]}`)
            return null
          }

          const callData = response.data || response
          const callId = callIds[index]

          console.log(`[v0] Processing call ${callId}`)
          console.log(`[v0] Call data keys:`, Object.keys(callData))

          let transcript = ""

          // Priority 1: jobResponse.transcription array (most detailed)
          if (callData.data?.jobResponse?.transcription && Array.isArray(callData.data.jobResponse.transcription)) {
            console.log(`[v0] Call ${callId}: Extracting from jobResponse.transcription array`)
            transcript = callData.data.jobResponse.transcription
              .map((item: any) => {
                if (item.Agent) {
                  return `Agent: ${typeof item.Agent === "string" ? item.Agent : JSON.stringify(item.Agent)}`
                } else if (item.User) {
                  return `Customer: ${typeof item.User === "string" ? item.User : JSON.stringify(item.User)}`
                }
                return ""
              })
              .filter((line: string) => line.length > 0)
              .join("\n")
          }
          // Priority 2: Top-level toScript (outbound)
          else if (callData.toScript && typeof callData.toScript === "string" && callData.toScript.length > 10) {
            console.log(`[v0] Call ${callId}: Using top-level toScript`)
            transcript = callData.toScript
          }
          // Priority 3: Top-level fromScript (inbound)
          else if (callData.fromScript && typeof callData.fromScript === "string" && callData.fromScript.length > 10) {
            console.log(`[v0] Call ${callId}: Using top-level fromScript`)
            transcript = callData.fromScript
          }
          // Priority 4: data.toScript
          else if (
            callData.data?.toScript &&
            typeof callData.data.toScript === "string" &&
            callData.data.toScript.length > 10
          ) {
            console.log(`[v0] Call ${callId}: Using data.toScript`)
            transcript = callData.data.toScript
          }
          // Priority 5: data.fromScript
          else if (
            callData.data?.fromScript &&
            typeof callData.data.fromScript === "string" &&
            callData.data.fromScript.length > 10
          ) {
            console.log(`[v0] Call ${callId}: Using data.fromScript`)
            transcript = callData.data.fromScript
          }
          // Priority 6: data.transcript
          else if (
            callData.data?.transcript &&
            typeof callData.data.transcript === "string" &&
            callData.data.transcript.length > 10
          ) {
            console.log(`[v0] Call ${callId}: Using data.transcript`)
            transcript = callData.data.transcript
          }
          // Priority 7: Top-level transcript
          else if (callData.transcript && typeof callData.transcript === "string" && callData.transcript.length > 10) {
            console.log(`[v0] Call ${callId}: Using top-level transcript`)
            transcript = callData.transcript
          }
          // Priority 8: messages array
          else if (callData.messages && Array.isArray(callData.messages)) {
            console.log(`[v0] Call ${callId}: Extracting from messages array`)
            transcript = callData.messages
              .filter((msg: any) => msg.message || msg.content || msg.text)
              .map((msg: any) => {
                const role =
                  msg.role === "assistant" || msg.role === "bot" || msg.role === "agent" ? "Agent" : "Customer"
                const content = msg.message || msg.content || msg.text || ""
                return `${role}: ${content}`
              })
              .join("\n")
          }
          // Priority 9: conversation field
          else if (callData.conversation) {
            console.log(`[v0] Call ${callId}: Using conversation field`)
            transcript =
              typeof callData.conversation === "string" ? callData.conversation : JSON.stringify(callData.conversation)
          }

          console.log(`[v0] Call ${callId}: Final transcript length = ${transcript.length}`)
          if (transcript.length > 0) {
            console.log(`[v0] Call ${callId}: Transcript preview: ${transcript.substring(0, 200)}...`)
          } else {
            console.log(`[v0] Call ${callId}: ⚠️ NO TRANSCRIPT FOUND`)
          }

          // Extract other call details
          const duration =
            callData.data?.callDuration || callData.callDuration || callData.data?.duration || callData.duration || 0
          const toNumber = callData.data?.toNumber || callData.toNumber || "Unknown"
          const params = callData.data?.agentDetails?.params || callData.agentDetails?.params || {}
          const greetingMessage =
            callData.data?.agentDetails?.greetingMessage || callData.agentDetails?.greetingMessage || ""

          return {
            callId: callId,
            contactName: params?.respondent_name || toNumber,
            transcript: transcript,
            duration: duration,
            status: callData.status || callData.data?.status || "completed",
            params: params,
            greetingMessage: greetingMessage,
          }
        })
      } catch (fetchError) {
        console.error("[v0] Error fetching job details:", fetchError)
        return NextResponse.json({ error: "Failed to fetch call data from Hamsa API" }, { status: 500 })
      }
    }

    const validTranscripts = callTranscripts.filter((t) => t && t.transcript && t.transcript.trim().length > 0)

    console.log(`[v0] Total calls processed: ${callTranscripts.filter(Boolean).length}`)
    console.log(`[v0] Calls with valid transcripts: ${validTranscripts.length}`)

    // Log each call's transcript status
    callTranscripts.filter(Boolean).forEach((t, i) => {
      console.log(`[v0] Call ${i + 1} (${t.callId}): transcript length = ${t.transcript?.length || 0}`)
    })

    if (validTranscripts.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not fetch any call transcripts. Please ensure the calls have completed and have transcript data.",
        },
        { status: 400 },
      )
    }

    console.log(`[v0] Generating AI evaluation with ${validTranscripts.length} transcripts...`)

    const geminiApiKey = process.env.GEMINI_API_KEY || "AIzaSyADIe8i4RD8RG4zGgQY-UcNA6LfaWQiSrk"
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`

    const evaluationPrompt = `أنت خبير في تقييم أداء الموظفين باستخدام منهجية التقييم 360 درجة.

**الموظف المراد تقييمه:** ${employeeName}

لقد تم إجراء ${validTranscripts.length} مكالمات مع أشخاص مختلفين لجمع آرائهم حول أداء هذا الموظف.

${validTranscripts
  .map(
    (call: any, idx: number) => `
---
**المكالمة ${idx + 1}:**
المستجيب: ${call.params?.respondent_name || call.contactName}
الدور: ${call.params?.respondent_role || "غير محدد"}
مدة المكالمة: ${Math.round(call.duration / 60)} دقيقة

**نص المحادثة:**
${call.transcript || "لا يوجد نص متاح"}
---
`,
  )
  .join("\n")}

**المطلوب منك:**

قم بتحليل جميع المكالمات أعلاه وإنشاء تقرير تقييمي شامل عن أداء الموظف ${employeeName}.

يجب أن يتضمن التقرير:

1. **ملخص الأداء العام** (4-6 جمل):
   - دمج الآراء من جميع المستجيبين
   - تحديد الأنماط والقواسم المشتركة
   - إبراز نقاط القوة والمجالات التي تحتاج تحسين

2. **نقاط القوة الرئيسية** (5-7 نقاط):
   - ما الذي يتقنه الموظف؟
   - ما هي الأنماط الإيجابية المتكررة؟

3. **مجالات التحسين** (5-7 نقاط):
   - ما هي التحديات أو نقاط الضعف؟
   - ما هي المهارات التي تحتاج تطوير؟

4. **مقاييس الأداء**:
   - الأداء العام (1-10)
   - مهارات التواصل (1-10)
   - الكفاءة التقنية (1-10)
   - خدمة العملاء (1-10)
   - العمل الجماعي والتعاون (1-10)
   - حل المشكلات (1-10)

5. **توصيات مفصلة** (7-10 توصيات قابلة للتنفيذ):
   - خطوات محددة للتحسين
   - اقتراحات للتدريب والتطوير
   - أفضل الممارسات للحفاظ على نقاط القوة

6. **تحليل التقييم 360 درجة**:
   - كيف ينظر الأشخاص من أدوار مختلفة للموظف؟
   - هل هناك آراء متضاربة؟
   - ماذا يكشف هذا عن أسلوب عمل الموظف؟

7. **اقتراحات التطوير المهني** (3-5 نقاط):
   - الخطوات التالية للنمو
   - مسارات مهنية محتملة
   - مهارات يجب تطويرها للترقية

قدم تقييماً شاملاً ومتوازناً وقابلة للتنفيذ بناءً على مصادر متعددة. كن محدداً وعادلاً وبناءً.`

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "أنت خبير موارد بشرية متخصص في تقييم الأداء وتحليل التقييم 360 درجة. قدم تقييمات شاملة ومتوازنة وقابلة للتنفيذ بناءً على مصادر متعددة. كن محدداً وعادلاً وبناءً.",
            },
          ],
        },
        contents: [
          {
            parts: [
              {
                text: evaluationPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              overallSummary: { type: "string" },
              keyStrengths: {
                type: "array",
                items: { type: "string" },
              },
              areasForImprovement: {
                type: "array",
                items: { type: "string" },
              },
              performanceMetrics: {
                type: "object",
                properties: {
                  overallScore: { type: "integer" },
                  communicationSkills: { type: "integer" },
                  technicalCompetence: { type: "integer" },
                  customerService: { type: "integer" },
                  teamwork: { type: "integer" },
                  problemSolving: { type: "integer" },
                },
                required: [
                  "overallScore",
                  "communicationSkills",
                  "technicalCompetence",
                  "customerService",
                  "teamwork",
                  "problemSolving",
                ],
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
              feedbackAnalysis: { type: "string" },
              careerDevelopment: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "overallSummary",
              "keyStrengths",
              "areasForImprovement",
              "performanceMetrics",
              "recommendations",
              "feedbackAnalysis",
              "careerDevelopment",
            ],
          },
        },
      }),
    })

    if (!geminiResponse.ok) {
      console.error("[v0] Gemini API error:", geminiResponse.status)
      const errorText = await geminiResponse.text()
      console.error("[v0] Error details:", errorText)
      return NextResponse.json({ error: "Failed to generate evaluation" }, { status: geminiResponse.status })
    }

    const geminiData = await geminiResponse.json()
    const evaluationText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ""

    console.log("[v0] Gemini evaluation response received, length:", evaluationText.length)

    let evaluation
    try {
      evaluation = JSON.parse(evaluationText)
      console.log("[v0] Evaluation parsed successfully")
    } catch (parseError: any) {
      console.error("[v0] Failed to parse Gemini response:", parseError.message)
      return NextResponse.json(
        {
          error: "Failed to parse evaluation response",
          details: parseError.message,
        },
        { status: 500 },
      )
    }

    const result = {
      success: true,
      employeeId,
      employeeName,
      evaluation,
      metrics: evaluation.performanceMetrics,
      generatedAt: new Date().toISOString(),
      numberOfCalls: validTranscripts.length,
    }

    console.log("[v0] Full evaluation generated successfully")

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error generating full evaluation:", error)
    return NextResponse.json(
      {
        error: "Failed to generate full evaluation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
