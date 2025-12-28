import { type NextRequest, NextResponse } from "next/server"
import { createHamsaClient } from "@/lib/hamsa-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Evaluation call request received:", JSON.stringify(body, null, 2))

    const { employeeName, employeePosition, employeeId, contactName, contactPhone, contactRole, language = "en" } = body

    if (!employeeName || !contactName || !contactPhone) {
      return NextResponse.json({ error: "Employee name, contact name, and phone number are required" }, { status: 400 })
    }

    const hamsa = createHamsaClient()
    const voiceAgentId = process.env.HAMSA_VOICE_AGENT_ID

    if (!voiceAgentId) {
      return NextResponse.json(
        { error: "HAMSA_VOICE_AGENT_ID environment variable is not configured" },
        { status: 500 },
      )
    }

    // Build the evaluation script based on the contact role and language
    const evaluationPrompt = buildEvaluationPrompt(employeeName, employeePosition, contactRole, language)

    const callTitle = `Evaluation: ${employeeName} - ${contactName}`

    const callParams = {
      toNumber: contactPhone,
      voiceAgentId: voiceAgentId,
      params: {
        employee_name: employeeName,
        employee_id: employeeId || employeeName.toLowerCase().replace(/\s+/g, "_"),
        employee_position: employeePosition || "Employee",
        respondent_name: contactName,
        respondent_role: contactRole,
        evaluation_prompt: evaluationPrompt,
        phone_number: contactPhone,
        language: language,
        evaluation_type: "employee_evaluation",
        customerName: contactName,
      },
      title: callTitle,
    }

    console.log("[v0] Creating evaluation call with params:", JSON.stringify(callParams, null, 2))

    const response = await hamsa.createCallWithPhoneNumber(callParams)

    console.log("[v0] Evaluation call created:", response.success ? "SUCCESS" : "FAILED")
    console.log("[v0] Job ID:", response.data?.jobId || response.data?.id || "NONE")

    const jobId = response.data?.jobId || response.data?.id

    return NextResponse.json({
      success: true,
      data: response.data,
      jobId: jobId,
      customerName: contactName,
      phoneNumber: contactPhone,
      employeeId: employeeId || employeeName.toLowerCase().replace(/\s+/g, "_"),
      employeeName,
      employeePosition,
      contactName,
      contactRole,
      language,
      message: `Evaluation call initiated for ${contactName}`,
    })
  } catch (error) {
    console.error("[v0] Error creating evaluation call:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create evaluation call" },
      { status: 500 },
    )
  }
}

function buildEvaluationPrompt(
  employeeName: string,
  employeePosition: string,
  contactRole: string,
  language: string,
): string {
  if (language === "ar") {
    return buildArabicPrompt(employeeName, employeePosition, contactRole)
  }
  return buildEnglishPrompt(employeeName, employeePosition, contactRole)
}

function buildEnglishPrompt(employeeName: string, employeePosition: string, contactRole: string): string {
  const roleContext = getRoleContext(contactRole, "en")

  return `You are an AI evaluation assistant from the Oman Ministry of Transport and Communications.

You are conducting a professional performance evaluation for ${employeeName}, who works as ${employeePosition}.

You are speaking with someone who is their ${roleContext}.

Your objectives:
1. Introduce yourself professionally and explain the purpose of the call
2. Ask about their working relationship with ${employeeName}
3. Evaluate ${employeeName}'s performance in the following areas:
   - Communication skills and professionalism
   - Technical competence and job knowledge
   - Teamwork and collaboration
   - Problem-solving abilities
   - Reliability and punctuality
   - Leadership qualities (if applicable)
4. Ask for specific examples of strengths and areas for improvement
5. Collect an overall performance rating on a scale of 1-10
6. Ask if they have any additional comments or feedback

Be professional, respectful, and objective. Listen carefully and probe for specific examples. Keep the conversation focused and aim to complete the evaluation in 5-7 minutes.

Thank them for their time and valuable feedback.`
}

function buildArabicPrompt(employeeName: string, employeePosition: string, contactRole: string): string {
  const roleContext = getRoleContext(contactRole, "ar")

  return `أنت مساعد تقييم ذكي من وزارة النقل والاتصالات العمانية.

أنت تجري تقييم أداء مهني لـ ${employeeName}، الذي يعمل كـ ${employeePosition}.

أنت تتحدث مع شخص هو ${roleContext}.

أهدافك:
1. قدم نفسك بشكل احترافي واشرح الغرض من المكالمة
2. اسأل عن علاقة العمل مع ${employeeName}
3. قيّم أداء ${employeeName} في المجالات التالية:
   - مهارات التواصل والاحترافية
   - الكفاءة التقنية والمعرفة الوظيفية
   - العمل الجماعي والتعاون
   - قدرات حل المشكلات
   - الموثوقية والالتزام بالمواعيد
   - القيادة (إن وجدت)
4. اطلب أمثلة محددة على نقاط القوة ومجالات التحسين
5. احصل على تقييم أداء عام على مقياس من 1-10
6. اسأل إذا كان لديهم أي تعليقات أو ملاحظات إضافية

كن محترفاً ومحترماً وموضوعياً. استمع بعناية واطلب أمثلة محددة. حافظ على تركيز المحادثة واهدف لإكمال التقييم في 5-7 دقائق.

اشكرهم على وقتهم وملاحظاتهم القيمة.`
}

function getRoleContext(role: string, language: string): string {
  if (language === "ar") {
    switch (role) {
      case "manager":
        return "مديرهم"
      case "colleague":
        return "زميلهم في العمل"
      case "subordinate":
        return "أحد مرؤوسيهم"
      case "partner":
        return "شريك عملهم"
      default:
        return "زميل"
    }
  }

  switch (role) {
    case "manager":
      return "manager"
    case "colleague":
      return "work colleague"
    case "subordinate":
      return "subordinate"
    case "partner":
      return "business partner"
    default:
      return "colleague"
  }
}
