"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Download,
  User,
  Calendar,
  BarChart3,
  TrendingUp,
  Target,
  AlertCircle,
  Lightbulb,
  Users,
  RefreshCw,
  Phone,
  MessageSquare,
  UserCheck,
} from "lucide-react"

interface EvaluationData {
  overallSummary: string
  keyStrengths: string[]
  areasForImprovement: string[]
  performanceMetrics: {
    overallScore: number
    communicationSkills: number
    technicalCompetence: number
    customerService: number
    teamwork: number
    problemSolving: number
  }
  recommendations: string[]
  feedbackAnalysis: string
  careerDevelopment: string[]
}

interface CallDetail {
  callId: string
  contactName: string
  contactRole: string
  contactPhone: string
  transcript: string
  completedAt?: string
  duration?: string
}

interface FullEvaluationData {
  employeeId: string
  employeeName: string
  evaluation: EvaluationData
  metrics: {
    overallScore: number
    communicationSkills: number
    technicalCompetence: number
    customerService: number
    teamwork: number
    problemSolving: number
  }
  generatedAt: string
  callDetails?: CallDetail[] // Added call details
}

export default function FullEvaluationPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params?.employeeId as string

  const [evaluationData, setEvaluationData] = useState<FullEvaluationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadEvaluation()
  }, [employeeId])

  const loadEvaluation = () => {
    try {
      const stored = localStorage.getItem("full_evaluations")
      if (!stored) {
        setIsLoading(false)
        return
      }

      const allEvals = JSON.parse(stored)
      const evalData = allEvals[employeeId]

      if (!evalData) {
        setIsLoading(false)
        return
      }

      const metaStored = localStorage.getItem("evaluation_metadata")
      const metadata = metaStored ? JSON.parse(metaStored) : {}

      const employeeMetadata = metadata[employeeId]
      const employeeName = employeeMetadata?.employeeName || employeeId

      const callDetails: CallDetail[] = []

      // Get transcripts
      const transcriptsStored = localStorage.getItem("evaluation_transcripts")
      const allTranscripts = transcriptsStored ? JSON.parse(transcriptsStored) : {}
      const employeeTranscripts = allTranscripts[employeeId] || []

      console.log("[v0] Loading evaluation for employeeId:", employeeId)
      console.log("[v0] Employee metadata:", JSON.stringify(employeeMetadata))
      console.log("[v0] Employee transcripts count:", employeeTranscripts.length)
      console.log("[v0] Employee transcripts:", JSON.stringify(employeeTranscripts))

      // Get contact details from metadata
      const contacts = employeeMetadata?.contacts || []
      console.log("[v0] Contacts from metadata:", JSON.stringify(contacts))

      employeeTranscripts.forEach((t: any, index: number) => {
        const contact = contacts.find((c: any) => c.callId === t.callId)
        console.log(`[v0] Transcript ${index}: callId=${t.callId}, found contact:`, contact)

        callDetails.push({
          callId: t.callId,
          contactName: contact?.name || t.contactName || t.respondentName || "مُقيِّم " + (index + 1),
          contactRole: contact?.role || t.role || t.respondentRole || "غير محدد",
          contactPhone: contact?.phone || t.phoneNumber || "غير متوفر",
          transcript: t.transcript || "",
          completedAt: t.savedAt || t.createdAt || new Date().toISOString(),
          duration: t.duration
            ? `${Math.floor(t.duration / 60)}:${(t.duration % 60).toString().padStart(2, "0")}`
            : undefined,
        })
      })

      console.log("[v0] Final call details:", JSON.stringify(callDetails))

      setEvaluationData({
        employeeId,
        employeeName,
        evaluation: evalData.evaluation,
        metrics: evalData.metrics,
        generatedAt: evalData.generatedAt,
        callDetails,
      })
    } catch (error) {
      console.error("[v0] Error loading evaluation:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTranscript = (callId: string) => {
    setExpandedTranscripts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(callId)) {
        newSet.delete(callId)
      } else {
        newSet.add(callId)
      }
      return newSet
    })
  }

  const getArabicRole = (role: string): string => {
    const roleMap: Record<string, string> = {
      manager: "مدير",
      supervisor: "مشرف",
      colleague: "زميل",
      client: "عميل",
      "cross-department": "قسم آخر",
      vendor: "مورد",
      "team-lead": "قائد فريق",
      "senior-manager": "مدير أعلى",
      consultant: "مستشار",
      subordinate: "مرؤوس",
    }
    return roleMap[role.toLowerCase()] || role
  }

  const getRoleBadgeColor = (role: string): string => {
    const colorMap: Record<string, string> = {
      manager: "bg-purple-100 text-purple-800 border-purple-200",
      supervisor: "bg-blue-100 text-blue-800 border-blue-200",
      colleague: "bg-green-100 text-green-800 border-green-200",
      client: "bg-orange-100 text-orange-800 border-orange-200",
      "cross-department": "bg-cyan-100 text-cyan-800 border-cyan-200",
      vendor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "team-lead": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "senior-manager": "bg-red-100 text-red-800 border-red-200",
      consultant: "bg-pink-100 text-pink-800 border-pink-200",
      subordinate: "bg-teal-100 text-teal-800 border-teal-200",
    }
    return colorMap[role.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const handleDownload = () => {
    if (!evaluationData) return

    const evaluation = evaluationData.evaluation
    const content = `
تقرير التقييم الشامل للأداء
الموظف: ${evaluationData.employeeName}
تاريخ التقرير: ${new Date(evaluationData.generatedAt).toLocaleString("ar-SA")}

${"=".repeat(80)}

ملخص الأداء العام
${evaluation.overallSummary}

${"=".repeat(80)}

نقاط القوة الرئيسية
${evaluation.keyStrengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${"=".repeat(80)}

مجالات التحسين
${evaluation.areasForImprovement.map((a, i) => `${i + 1}. ${a}`).join("\n")}

${"=".repeat(80)}

مؤشرات الأداء
التقييم العام: ${evaluationData.metrics.overallScore}/10
مهارات التواصل: ${evaluationData.metrics.communicationSkills}/10
الكفاءة التقنية: ${evaluationData.metrics.technicalCompetence}/10
خدمة العملاء: ${evaluationData.metrics.customerService}/10
العمل الجماعي: ${evaluationData.metrics.teamwork}/10
حل المشكلات: ${evaluationData.metrics.problemSolving}/10

${"=".repeat(80)}

تفاصيل المكالمات
${
  evaluationData.callDetails
    ?.map(
      (call, i) => `
${i + 1}. ${call.contactName} (${getArabicRole(call.contactRole)})
   الهاتف: ${call.contactPhone}
   النص: ${call.transcript.substring(0, 200)}...
`,
    )
    .join("\n") || "لا توجد مكالمات"
}

${"=".repeat(80)}

التوصيات
${evaluation.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

${"=".repeat(80)}

تحليل التغذية الراجعة 360 درجة
${evaluation.feedbackAnalysis}

${"=".repeat(80)}

اقتراحات التطوير المهني
${evaluation.careerDevelopment.map((c, i) => `${i + 1}. ${c}`).join("\n")}
    `.trim()

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `تقييم-${evaluationData.employeeName.replace(/\s+/g, "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRegenerate = async () => {
    if (!evaluationData) return

    try {
      setIsRegenerating(true)

      const metaStored = localStorage.getItem("evaluation_metadata")

      if (!metaStored) {
        alert("لا يمكن العثور على سجلات المكالمات لهذا الموظف. يرجى بدء المكالمات أولاً من صفحة المكالمات.")
        return
      }

      const metadata = JSON.parse(metaStored)
      const employeeMetadata = metadata[employeeId]

      if (!employeeMetadata || !employeeMetadata.callIds) {
        alert("لا توجد سجلات مكالمات لهذا الموظف. يرجى بدء المكالمات أولاً من صفحة المكالمات.")
        return
      }

      const callIds = employeeMetadata.callIds

      const response = await fetch("/api/evaluation/generate-full-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: evaluationData.employeeId,
          employeeName: evaluationData.employeeName,
          callIds: callIds,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "فشل في إعادة إنشاء التقييم")
      }

      const existingEvals = localStorage.getItem("full_evaluations")
      const evalsData = existingEvals ? JSON.parse(existingEvals) : {}
      evalsData[employeeId] = {
        evaluation: data.evaluation,
        metrics: data.metrics,
        generatedAt: data.generatedAt,
      }
      localStorage.setItem("full_evaluations", JSON.stringify(evalsData))

      // Reload to get fresh call details
      loadEvaluation()

      alert("تم إعادة إنشاء تقرير التقييم بنجاح!")
    } catch (error) {
      console.error("[v0] Error regenerating evaluation:", error)
      alert("فشل في إعادة إنشاء التقييم: " + (error instanceof Error ? error.message : "خطأ غير معروف"))
    } finally {
      setIsRegenerating(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600"
    if (score >= 6) return "text-blue-600"
    if (score >= 4) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return "bg-green-50 border-green-200"
    if (score >= 6) return "bg-blue-50 border-blue-200"
    if (score >= 4) return "bg-orange-50 border-orange-200"
    return "bg-red-50 border-red-200"
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <DashboardHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">جاري تحميل التقييم...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!evaluationData) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <DashboardHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">التقييم غير موجود</p>
            <p className="text-muted-foreground mb-4">لم يتم العثور على بيانات التقييم لهذا الموظف.</p>
            <Button onClick={() => router.push("/logs")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              العودة للسجلات
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const evaluation = evaluationData.evaluation

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push("/logs")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              العودة للسجلات
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="gap-2 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                {isRegenerating ? "جاري إعادة الإنشاء..." : "إعادة إنشاء التقرير"}
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                تحميل التقرير
              </Button>
            </div>
          </div>

          {isRegenerating && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-3 border-orange-600 border-t-transparent rounded-full" />
                <p className="text-orange-800 dark:text-orange-200 font-medium">
                  جاري إعادة إنشاء تقرير التقييم... قد يستغرق هذا بعض الوقت.
                </p>
              </div>
            </div>
          )}

          {/* Employee Header Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <User className="h-6 w-6" />
                    {evaluationData.employeeName}
                  </CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {isRegenerating ? (
                      <span className="text-orange-600">جاري إعادة إنشاء التقرير...</span>
                    ) : (
                      <>
                        تاريخ التقييم:{" "}
                        {new Date(evaluationData.generatedAt).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </>
                    )}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={`text-lg px-4 py-2 ${getScoreBgColor(evaluationData.metrics.overallScore)}`}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  التقييم العام: {evaluationData.metrics.overallScore}/10
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Overall Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                ملخص الأداء العام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed text-right" dir="rtl">
                {evaluation.overallSummary}
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                مؤشرات الأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "مهارات التواصل", value: evaluationData.metrics.communicationSkills, icon: MessageSquare },
                  { label: "الكفاءة التقنية", value: evaluationData.metrics.technicalCompetence, icon: Target },
                  { label: "خدمة العملاء", value: evaluationData.metrics.customerService, icon: UserCheck },
                  { label: "العمل الجماعي", value: evaluationData.metrics.teamwork, icon: Users },
                  { label: "حل المشكلات", value: evaluationData.metrics.problemSolving, icon: Lightbulb },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className={`flex items-center justify-between p-4 rounded-lg border ${getScoreBgColor(metric.value)}`}
                  >
                    <div className="flex items-center gap-2">
                      <metric.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <span className={`text-2xl font-bold ${getScoreColor(metric.value)}`}>{metric.value}/10</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {evaluationData.callDetails && evaluationData.callDetails.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  تفاصيل المكالمات ({evaluationData.callDetails.length})
                </CardTitle>
                <CardDescription>نظرة معمقة على جميع المكالمات التي تمت لتقييم هذا الموظف</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-right font-bold">المُقيِّم</TableHead>
                        <TableHead className="text-right font-bold">العلاقة</TableHead>
                        <TableHead className="text-right font-bold">رقم الهاتف</TableHead>
                        <TableHead className="text-right font-bold">التاريخ</TableHead>
                        <TableHead className="text-right font-bold">نص المحادثة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluationData.callDetails.map((call, index) => (
                        <TableRow key={call.callId} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              {call.contactName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRoleBadgeColor(call.contactRole)}>
                              {getArabicRole(call.contactRole)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-sm" dir="ltr">
                            {call.contactPhone}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {call.completedAt
                              ? new Date(call.completedAt).toLocaleDateString("ar-SA", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTranscript(call.callId)}
                              className="text-primary hover:text-primary/80"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {expandedTranscripts.has(call.callId) ? "إخفاء" : "عرض"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Expanded Transcripts */}
                {evaluationData.callDetails.map(
                  (call) =>
                    expandedTranscripts.has(call.callId) && (
                      <div key={`transcript-${call.callId}`} className="mt-4 p-4 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className={getRoleBadgeColor(call.contactRole)}>
                            {getArabicRole(call.contactRole)}
                          </Badge>
                          <span className="font-semibold">{call.contactName}</span>
                          <span className="text-muted-foreground">- نص المحادثة</span>
                        </div>
                        <div
                          className="bg-background p-4 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap"
                          dir="rtl"
                        >
                          {call.transcript || "لا يوجد نص متاح لهذه المكالمة"}
                        </div>
                      </div>
                    ),
                )}
              </CardContent>
            </Card>
          )}

          {/* Key Strengths */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                نقاط القوة الرئيسية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" dir="rtl">
                {evaluation.keyStrengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>
                    <span className="text-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                مجالات التحسين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" dir="rtl">
                {evaluation.areasForImprovement.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-600 font-bold mt-0.5">•</span>
                    <span className="text-foreground">{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                التوصيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" dir="rtl">
                {evaluation.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold mt-0.5">{idx + 1}.</span>
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 360 Feedback Analysis */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                تحليل التغذية الراجعة 360 درجة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed text-right" dir="rtl">
                {evaluation.feedbackAnalysis}
              </p>
            </CardContent>
          </Card>

          {/* Career Development */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                اقتراحات التطوير المهني
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" dir="rtl">
                {evaluation.careerDevelopment.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-0.5">←</span>
                    <span className="text-foreground">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
