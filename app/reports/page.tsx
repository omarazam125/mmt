"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, FileText, Clock, Phone, TrendingUp, Trash2 } from "lucide-react"

interface CallReport {
  id: string
  callId: string
  customerName: string
  phoneNumber: string
  customerEmail: string
  duration: number
  status: string
  createdAt: string
  language: string
  generatedAt: string
  analysis?: {
    overallScore: number
    customerCooperation: { score: number; description: string }
    engagement: { score: number; description: string }
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<CallReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      console.log("[v0] Loading reports from localStorage...")

      const storedReports = localStorage.getItem("call-reports")
      if (storedReports) {
        const localReports = JSON.parse(storedReports)

        const transformedReports: CallReport[] = localReports.map((report: any) => ({
          id: report.id,
          callId: report.callId || report.id,
          customerName: report.customerName || "Unknown",
          phoneNumber: report.phoneNumber || "N/A",
          customerEmail: report.customerEmail || "",
          duration: parseDuration(report.duration),
          status: report.status || "completed",
          createdAt: report.createdAt || new Date().toISOString(),
          language: report.language || "en",
          generatedAt: report.generatedAt || report.createdAt || new Date().toISOString(),
          analysis: report.analysis || {},
        }))

        setReports(transformedReports)
        console.log("[v0] Loaded", transformedReports.length, "reports from localStorage")
      } else {
        setReports([])
      }
    } catch (error) {
      console.error("[v0] Error loading reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const parseDuration = (duration: any): number => {
    if (typeof duration === "number") return duration
    if (typeof duration === "string") {
      const parts = duration.split(":")
      if (parts.length === 2) {
        return Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1])
      }
    }
    return 0
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      const updatedReports = reports.filter((r) => r.id !== reportId)
      localStorage.setItem("call-reports", JSON.stringify(updatedReports))
      setReports(updatedReports)
      console.log("[v0] Report deleted from localStorage successfully")
    } catch (error) {
      console.error("[v0] Error deleting report:", error)
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.phoneNumber?.includes(searchQuery) ||
      report.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ended":
      case "completed":
        return "bg-green-500/10 text-green-500"
      case "in-progress":
        return "bg-blue-500/10 text-blue-500"
      case "failed":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">تقارير المكالمات - المعيد</h1>
              <p className="text-muted-foreground mt-1">
                تحليلات شاملة ورؤى مدعومة بالذكاء الاصطناعي لجميع مكالمات خدمة العملاء
              </p>
            </div>
            <Button onClick={loadReports} variant="outline">
              <TrendingUp className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث بالاسم أو رقم الهاتف أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">جاري تحميل التقارير...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد تقارير</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "حاول تعديل معايير البحث"
                  : "قم بإجراء مكالمات من صفحة المكالمات لرؤية التقارير هنا"}
              </p>
              <Link href="/calls">
                <Button>الذهاب للمكالمات</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <Link href={`/reports/${report.id}`} className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{report.customerName || "Unknown"}</h3>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status === "ended"
                              ? "مكتملة"
                              : report.status === "completed"
                                ? "مكتملة"
                                : report.status === "in-progress"
                                  ? "قيد التنفيذ"
                                  : "فاشلة"}
                          </Badge>
                          {report.language && (
                            <Badge variant="outline">{report.language === "ar" ? "عربي" : "إنجليزي"}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {report.phoneNumber}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(report.duration)}
                          </span>
                          <span>{new Date(report.createdAt).toLocaleString("ar-SA")}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-4">
                      {report.analysis?.overallScore && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{report.analysis.overallScore}/10</div>
                          <div className="text-xs text-muted-foreground">التقييم الإجمالي</div>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault()
                          handleDeleteReport(report.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
