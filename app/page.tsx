"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { StatCard } from "@/components/stat-card"
import { Phone, Clock, CheckCircle2, TrendingUp, Users, Calendar, PhoneCall, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HamsaConnectionStatus } from "@/components/hamsa-connection-status"
import { useEffect, useState } from "react"

interface CallStats {
  totalCalls: number
  activeCalls: number
  avgDuration: string
  successRate: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<CallStats>({
    totalCalls: 0,
    activeCalls: 0,
    avgDuration: "0:00",
    successRate: "0%",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [employeeCount, setEmployeeCount] = useState(0)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/hamsa/analytics")
        if (response.ok) {
          const data = await response.json()

          const avgMinutes = Math.floor((data.averageDuration || 0) / 60)
          const avgSeconds = Math.floor((data.averageDuration || 0) % 60)

          setStats({
            totalCalls: data.totalCalls || 0,
            activeCalls: data.activeCalls || 0,
            avgDuration: `${avgMinutes}:${avgSeconds.toString().padStart(2, "0")}`,
            successRate: data.successRate ? `${(data.successRate * 100).toFixed(1)}%` : "0%",
          })
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const employees = JSON.parse(localStorage.getItem("employees") || "[]")
    setEmployeeCount(employees.length)

    fetchStats()
    const interval = setInterval(() => {
      fetchStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background w-full">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="font-sans text-3xl font-bold text-foreground">
            وزارة النقل والاتصالات وتقنية المعلومات
          </h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            نظام تقييم أداء الموظفين - لوحة التحكم الرئيسية
          </p>
        </div>

        <div className="mb-6">
          <HamsaConnectionStatus />
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي المكالمات"
            value={isLoading ? "..." : stats.totalCalls.toString()}
            change="بيانات مباشرة"
            changeType="positive"
            icon={Phone}
          />
          <StatCard
            title="المكالمات النشطة"
            value={isLoading ? "..." : stats.activeCalls.toString()}
            description="قيد التنفيذ حالياً"
            icon={PhoneCall}
          />
          <StatCard
            title="متوسط مدة المكالمة"
            value={isLoading ? "..." : stats.avgDuration}
            change="بيانات فورية"
            changeType="positive"
            icon={Clock}
          />
          <StatCard
            title="معدل النجاح"
            value={isLoading ? "..." : stats.successRate}
            change="محسوب من المكالمات"
            changeType="positive"
            icon={CheckCircle2}
          />
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-3">
          <StatCard
            title="الموظفون المسجلون"
            value={employeeCount.toString()}
            description="متاح للتقييم"
            icon={Users}
          />
          <StatCard title="المكالمات المجدولة" value="156" description="خلال الـ 24 ساعة القادمة" icon={Calendar} />
          <StatCard title="معدل الرضا" value="91%" description="الأداء الإجمالي" icon={UserCheck} />
        </div>

        <Card className="mb-6 bg-card">
          <CardHeader>
            <CardTitle className="font-sans text-xl font-semibold text-card-foreground">إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button className="h-auto flex-col gap-2 py-6 bg-transparent" variant="outline">
                <Phone className="h-6 w-6" />
                <span className="font-sans text-sm font-medium">إجراء مكالمة</span>
              </Button>
              <Button className="h-auto flex-col gap-2 py-6 bg-transparent" variant="outline">
                <Calendar className="h-6 w-6" />
                <span className="font-sans text-sm font-medium">جدولة مكالمة</span>
              </Button>
              <Button className="h-auto flex-col gap-2 py-6 bg-transparent" variant="outline">
                <Users className="h-6 w-6" />
                <span className="font-sans text-sm font-medium">عرض العملاء</span>
              </Button>
              <Button className="h-auto flex-col gap-2 py-6 bg-transparent" variant="outline">
                <TrendingUp className="h-6 w-6" />
                <span className="font-sans text-sm font-medium">عرض التحليلات</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
