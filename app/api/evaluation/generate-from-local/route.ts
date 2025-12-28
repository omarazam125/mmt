import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { employeeId, employeeName, transcripts } = await request.json()

    console.log("[v0] Generating full evaluation from local transcripts")
    console.log("[v0] Employee:", employeeName)
    console.log("[v0] Number of transcripts:", transcripts?.length || 0)

    if (!employeeId || !employeeName) {
      return NextResponse.json({ error: "Employee ID and name are required" }, { status: 400 })
    }

    if (!transcripts || transcripts.length === 0) {
      return NextResponse.json({ error: "At least one transcript is required" }, { status: 400 })
    }

    console.log("[v0] Generating AI evaluation with Gemini...")
    const geminiApiKey = process.env.GEMINI_API_KEY || "AIzaSyADIe8i4RD8RG4zGgQY-UcNA6LfaWQiSrk"
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`

    const evaluationPrompt = `أنت خبير في تقييم أداء الموظفين باستخدام منهجية التقييم 360 درجة.

**الموظف المراد تقييمه:** ${employeeName}

لقد تم إجراء ${transcripts.length} مكالمات مع أشخاص مختلفين لجمع آرائهم حول أداء هذا الموظف.

${transcripts
  .map(
    (call: any, idx: number) => `
---
**المكالمة ${idx + 1}:**
المستجيب: ${call.respondentName || "غير معروف"}
الدور: ${call.respondentRole || "غير محدد"}
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
      numberOfCalls: transcripts.length,
    }

    console.log("[v0] Full evaluation generated successfully from local transcripts")

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error generating evaluation from local transcripts:", error)
    return NextResponse.json(
      {
        error: "Failed to generate evaluation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
