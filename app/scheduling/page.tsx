"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Plus, Edit, Trash2, Phone, User } from "lucide-react"
import { useState } from "react"

interface ScheduledCall {
  id: string
  evaluatorName: string
  phoneNumber: string
  scheduledDate: string
  scheduledTime: string
  purpose: string
  employeeName: string
  department: string
  notes: string
  status: "pending" | "completed" | "missed" | "cancelled"
  priority: "high" | "medium" | "low"
}

export default function SchedulingPage() {
  const [showForm, setShowForm] = useState(false)

  const scheduledCalls: ScheduledCall[] = [
    {
      id: "sched-001",
      evaluatorName: "أحمد محمد السيد",
      phoneNumber: "+968 9123 4567",
      scheduledDate: "2025-02-11",
      scheduledTime: "10:00",
      purpose: "تقييم 360 درجة",
      employeeName: "محمد عمر الشريف",
      department: "قسم خدمات الاتصالات",
      notes: "مدير مباشر - تقييم الأداء السنوي",
      status: "pending",
      priority: "high",
    },
    {
      id: "sched-002",
      evaluatorName: "فاطمة أحمد البلوشي",
      phoneNumber: "+968 9234 5678",
      scheduledDate: "2025-02-11",
      scheduledTime: "14:30",
      purpose: "تقييم من زميل",
      employeeName: "محمد عمر الشريف",
      department: "قسم النقل البري",
      notes: "زميلة من قسم مختلف - تقييم التعاون",
      status: "pending",
      priority: "medium",
    },
    {
      id: "sched-003",
      evaluatorName: "خالد سعيد المقبالي",
      phoneNumber: "+968 9345 6789",
      scheduledDate: "2025-02-11",
      scheduledTime: "16:00",
      purpose: "تقييم من مرؤوس",
      employeeName: "سارة أحمد الهاشمية",
      department: "قسم البنية التحتية",
      notes: "موظف تحت الإشراف - تقييم القيادة",
      status: "pending",
      priority: "high",
    },
    {
      id: "sched-004",
      evaluatorName: "نورة عبدالله الشامسي",
      phoneNumber: "+968 9456 7890",
      scheduledDate: "2025-02-12",
      scheduledTime: "09:00",
      purpose: "تقييم من عميل داخلي",
      employeeName: "سارة أحمد الهاشمية",
      department: "قسم الموارد البشرية",
      notes: "مستفيد من الخدمات - تقييم جودة الخدمة",
      status: "pending",
      priority: "medium",
    },
    {
      id: "sched-005",
      evaluatorName: "يوسف إبراهيم الحارثي",
      phoneNumber: "+968 9567 8901",
      scheduledDate: "2025-02-12",
      scheduledTime: "11:30",
      purpose: "تقييم من مدير أعلى",
      employeeName: "علي حسن المعمري",
      department: "قسم الشؤون القانونية",
      notes: "تقييم استراتيجي - مراجعة الأداء الإداري",
      status: "pending",
      priority: "high",
    },
  ]

  const getPriorityColor = (priority: ScheduledCall["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-destructive/20 text-destructive border-destructive/30"
      case "medium":
        return "bg-warning/20 text-warning border-warning/30"
      case "low":
        return "bg-muted text-muted-foreground border-muted"
    }
  }

  const getStatusColor = (status: ScheduledCall["status"]) => {
    switch (status) {
      case "pending":
        return "bg-primary/20 text-primary border-primary/30"
      case "completed":
        return "bg-success/20 text-success border-success/30"
      case "missed":
        return "bg-destructive/20 text-destructive border-destructive/30"
      case "cancelled":
        return "bg-muted text-muted-foreground border-muted"
    }
  }

  // Group calls by date
  const groupedCalls = scheduledCalls.reduce(
    (acc, call) => {
      if (!acc[call.scheduledDate]) {
        acc[call.scheduledDate] = []
      }
      acc[call.scheduledDate].push(call)
      return acc
    },
    {} as Record<string, ScheduledCall[]>,
  )

  return (
    <div className="h-screen flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-sans text-3xl font-bold text-foreground">جدولة مكالمات التقييم</h1>
            <p className="mt-1 font-sans text-sm text-muted-foreground">
              جدولة وإدارة مكالمات تقييم موظفي وزارة النقل والاتصالات
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            جدولة مكالمة جديدة
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6 border-primary/50 bg-card">
            <CardHeader>
              <CardTitle className="font-sans text-xl font-semibold text-card-foreground">جدولة مكالمة تقييم</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="evaluator-name" className="font-sans text-sm font-medium">
                      اسم المُقيِّم
                    </Label>
                    <Input id="evaluator-name" placeholder="أدخل اسم المُقيِّم" className="mt-1.5 font-sans" />
                  </div>
                  <div>
                    <Label htmlFor="phone-number" className="font-sans text-sm font-medium">
                      رقم الهاتف
                    </Label>
                    <Input id="phone-number" type="tel" placeholder="+968 XXXX XXXX" className="mt-1.5 font-sans" />
                  </div>
                  <div>
                    <Label htmlFor="scheduled-date" className="font-sans text-sm font-medium">
                      تاريخ المكالمة
                    </Label>
                    <Input id="scheduled-date" type="date" className="mt-1.5 font-sans" />
                  </div>
                  <div>
                    <Label htmlFor="scheduled-time" className="font-sans text-sm font-medium">
                      وقت المكالمة
                    </Label>
                    <Input id="scheduled-time" type="time" className="mt-1.5 font-sans" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="purpose" className="font-sans text-sm font-medium">
                      نوع التقييم
                    </Label>
                    <Select>
                      <SelectTrigger id="purpose" className="mt-1.5 font-sans">
                        <SelectValue placeholder="اختر نوع التقييم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="360-evaluation">تقييم 360 درجة</SelectItem>
                        <SelectItem value="peer-review">تقييم من زميل</SelectItem>
                        <SelectItem value="manager-review">تقييم من مدير</SelectItem>
                        <SelectItem value="subordinate-review">تقييم من مرؤوس</SelectItem>
                        <SelectItem value="client-review">تقييم من عميل داخلي</SelectItem>
                        <SelectItem value="senior-review">تقييم من مدير أعلى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="employee-name" className="font-sans text-sm font-medium">
                      اسم الموظف المُراد تقييمه
                    </Label>
                    <Input id="employee-name" placeholder="أدخل اسم الموظف" className="mt-1.5 font-sans" />
                  </div>
                  <div>
                    <Label htmlFor="department" className="font-sans text-sm font-medium">
                      القسم
                    </Label>
                    <Input id="department" placeholder="أدخل اسم القسم" className="mt-1.5 font-sans" />
                  </div>
                  <div>
                    <Label htmlFor="priority" className="font-sans text-sm font-medium">
                      الأولوية
                    </Label>
                    <Select>
                      <SelectTrigger id="priority" className="mt-1.5 font-sans">
                        <SelectValue placeholder="اختر الأولوية" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">عالية</SelectItem>
                        <SelectItem value="medium">متوسطة</SelectItem>
                        <SelectItem value="low">منخفضة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes" className="font-sans text-sm font-medium">
                      ملاحظات
                    </Label>
                    <Textarea id="notes" placeholder="معلومات إضافية..." className="mt-1.5 font-sans" rows={3} />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button className="gap-2">
                  <Calendar className="h-4 w-4" />
                  جدولة المكالمة
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {Object.entries(groupedCalls).map(([date, calls]) => (
            <Card key={date} className="bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle className="font-sans text-xl font-semibold text-card-foreground">
                    {new Date(date).toLocaleDateString("ar-SA", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                    {calls.length} {calls.length === 1 ? "مكالمة" : "مكالمات"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {calls
                    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                    .map((call) => (
                      <Card key={call.id} className="border-border bg-secondary/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4 flex-1">
                              <div className="flex flex-col items-center gap-1 pt-1">
                                <Clock className="h-5 w-5 text-primary" />
                                <span className="font-mono text-sm font-semibold text-foreground">
                                  {call.scheduledTime}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                                    <User className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="font-sans text-base font-semibold text-foreground">
                                      {call.evaluatorName}
                                    </h3>
                                    <p className="font-mono text-sm text-muted-foreground">{call.phoneNumber}</p>
                                  </div>
                                  <Badge variant="outline" className={getPriorityColor(call.priority)}>
                                    {call.priority === "high"
                                      ? "عالية"
                                      : call.priority === "medium"
                                        ? "متوسطة"
                                        : "منخفضة"}
                                  </Badge>
                                  <Badge variant="outline" className={getStatusColor(call.status)}>
                                    {call.status === "pending"
                                      ? "قيد الانتظار"
                                      : call.status === "completed"
                                        ? "مكتملة"
                                        : call.status === "missed"
                                          ? "فائتة"
                                          : "ملغاة"}
                                  </Badge>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3 mt-3">
                                  <div>
                                    <p className="font-sans text-xs text-muted-foreground">الموظف المُقيَّم</p>
                                    <p className="mt-0.5 font-sans text-sm font-medium text-foreground">
                                      {call.employeeName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-sans text-xs text-muted-foreground">القسم</p>
                                    <p className="mt-0.5 font-sans text-sm font-medium text-foreground">
                                      {call.department}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-sans text-xs text-muted-foreground">نوع التقييم</p>
                                    <p className="mt-0.5 font-sans text-sm font-medium text-foreground">
                                      {call.purpose}
                                    </p>
                                  </div>
                                  <div className="md:col-span-3">
                                    <p className="font-sans text-xs text-muted-foreground">ملاحظات</p>
                                    <p className="mt-0.5 font-sans text-sm text-foreground">{call.notes}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="outline" className="bg-transparent" title="اتصال">
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="bg-transparent" title="تعديل">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="bg-transparent" title="حذف">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
