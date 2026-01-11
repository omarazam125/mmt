"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, PhoneMissed, Loader2, Users, CheckCircle2, Mail } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useTwilioVoice } from "@/hooks/use-twilio-voice"
import { saveCallToMemory } from "@/lib/call-memory"

interface Contact {
  id: string
  name: string
  phone: string
  role: "colleague" | "manager" | "partner" | "subordinate"
  language: "ar" | "en"
}

interface Employee {
  id: string
  name: string
  email: string
  department: string
  position: string
  contacts: Contact[]
}

interface HamsaJob {
  id: string
  status: string
  createdAt: string
  agentDetails?: {
    params?: {
      customerName?: string
      phoneNumber?: string
    }
  }
}

interface LiveCall {
  id: string
  customerName: string
  phoneNumber: string
  status: string
  duration: string
  startedAt: string
  twilioSid?: string
  hamsaJobId: string
}

export default function CallsPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isCallLoading, setIsCallLoading] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)
  const [callingContactIds, setCallingContactIds] = useState<Set<string>>(new Set())
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([])
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [notifiedEmployees, setNotifiedEmployees] = useState<Set<string>>(new Set())
  const { toast } = useToast()
  const twilioVoice = useTwilioVoice()

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchLiveCalls, 2000)
    fetchLiveCalls()
    return () => clearInterval(interval)
  }, [])

  const loadEmployees = () => {
    const stored = localStorage.getItem("employees")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setEmployees(parsed.filter((emp: Employee) => emp.contacts.length >= 2))
      } catch (error) {
        console.error("[v0] Error loading employees:", error)
      }
    }
  }

  const fetchLiveCalls = async () => {
    try {
      const response = await fetch("/api/hamsa/jobs?limit=50")
      const data = await response.json()
      const hamsaJobs: HamsaJob[] = data.data?.jobs || []

      const activeHamsaJobs = hamsaJobs.filter((job: HamsaJob) => {
        const status = job.status?.toLowerCase()
        const isActiveStatus = status === "processing" || status === "pending"

        if (job.createdAt) {
          const createdTime = new Date(job.createdAt).getTime()
          const now = new Date().getTime()
          const twoHours = 2 * 60 * 60 * 1000
          return isActiveStatus && now - createdTime < twoHours
        }

        return isActiveStatus
      })

      const transformedCalls: LiveCall[] = activeHamsaJobs.map((hamsaJob) => {
        const phoneNumber = hamsaJob.agentDetails?.params?.phoneNumber || "Unknown"
        let duration = "0:00"

        if (hamsaJob.createdAt) {
          const createdTime = new Date(hamsaJob.createdAt)
          const now = new Date()
          const durationMs = now.getTime() - createdTime.getTime()
          const minutes = Math.floor(durationMs / 60000)
          const seconds = Math.floor((durationMs % 60000) / 1000)
          duration = `${minutes}:${seconds.toString().padStart(2, "0")}`
        }

        return {
          id: hamsaJob.id || "",
          customerName: hamsaJob.agentDetails?.params?.customerName || "Unknown",
          phoneNumber,
          status: hamsaJob.status === "processing" ? "In Progress" : "Ringing...",
          duration,
          startedAt: hamsaJob.createdAt,
          hamsaJobId: hamsaJob.id,
        }
      })

      setLiveCalls(transformedCalls)
    } catch (error) {
      console.error("[v0] Error fetching live calls:", error)
    }
  }

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId)
    setSelectedEmployee(employee || null)
    setCallError(null)
  }

  const handleStartEvaluation = async () => {
    if (!selectedEmployee) return

    setIsCallLoading(true)
    setCallError(null)
    const newCallingIds = new Set(callingContactIds)

    try {
      const callIds: string[] = []

      console.log("[v0] Starting evaluation for employee:", selectedEmployee.id, selectedEmployee.name)

      const callPromises = selectedEmployee.contacts.map(async (contact) => {
        newCallingIds.add(contact.id)
        setCallingContactIds(new Set(newCallingIds))

        console.log("[v0] Initiating evaluation call for contact:", contact.name)

        const response = await fetch("/api/hamsa/evaluation-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId: selectedEmployee.id,
            employeeName: selectedEmployee.name,
            employeePosition: selectedEmployee.position,
            contactName: contact.name,
            contactPhone: contact.phone,
            contactRole: contact.role,
            language: contact.language,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || `Failed to create call for ${contact.name}`)
        }

        if (data.jobId) {
          saveCallToMemory(data.jobId, contact.name, contact.phone)
          callIds.push(data.jobId)
          console.log("[v0] Call created successfully. Job ID:", data.jobId)
        }

        return data
      })

      const results = await Promise.all(callPromises)

      if (callIds.length > 0) {
        const metaStored = localStorage.getItem("evaluation_metadata")
        const metadata = metaStored ? JSON.parse(metaStored) : {}

        // Store all call IDs under the employee
        metadata[selectedEmployee.id] = {
          employeeId: selectedEmployee.id,
          employeeName: selectedEmployee.name,
          employeePosition: selectedEmployee.position,
          callIds: callIds,
          contacts: selectedEmployee.contacts.map((contact, index) => ({
            callId: results[index]?.jobId,
            contactName: contact.name,
            contactRole: contact.role,
            contactPhone: contact.phone,
            language: contact.language,
          })),
          createdAt: new Date().toISOString(),
        }

        localStorage.setItem("evaluation_metadata", JSON.stringify(metadata))

        console.log("[v0] ===== METADATA SAVED =====")
        console.log("[v0] Employee ID:", selectedEmployee.id)
        console.log("[v0] Employee Name:", selectedEmployee.name)
        console.log("[v0] Number of calls:", callIds.length)
        console.log("[v0] Call IDs:", callIds)
        console.log("[v0] Metadata structure:", metadata[selectedEmployee.id])
        console.log("[v0] ===========================")

        const verifyStored = localStorage.getItem("evaluation_metadata")
        const verifyMetadata = verifyStored ? JSON.parse(verifyStored) : null
        console.log("[v0] Verification - Total employees in metadata:", Object.keys(verifyMetadata || {}).length)
      }

      toast({
        title: "Evaluation Started",
        description: `${results.length} calls initiated successfully`,
      })

      setTimeout(() => {
        setCallingContactIds(new Set())
      }, 5000)
    } catch (error) {
      console.error("[v0] Error in handleStartEvaluation:", error)
      setCallError(error instanceof Error ? error.message : "Failed to start evaluation")
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start evaluation",
        variant: "destructive",
      })
    } finally {
      setIsCallLoading(false)
    }
  }

  const handleSendEmailNotification = async () => {
    if (!selectedEmployee) return

    setIsSendingEmail(true)

    try {
      console.log("[v0] Sending email notification for employee:", selectedEmployee.name)

      const response = await fetch("/api/webhook/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee: {
            id: selectedEmployee.id,
            name: selectedEmployee.name,
            email: selectedEmployee.email,
            department: selectedEmployee.department,
            position: selectedEmployee.position,
          },
          contacts: selectedEmployee.contacts,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email notification")
      }

      setNotifiedEmployees((prev) => new Set(prev).add(selectedEmployee.id))

      toast({
        title: "Email Notification Sent",
        description: `Notification sent successfully for ${selectedEmployee.name}`,
      })

      console.log("[v0] Email notification sent successfully")
    } catch (error) {
      console.error("[v0] Error sending email notification:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send email notification",
        variant: "destructive",
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "manager":
        return "bg-primary/20 text-primary border-primary/30"
      case "colleague":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30"
      case "partner":
        return "bg-purple-500/20 text-purple-600 border-purple-500/30"
      case "subordinate":
        return "bg-green-500/20 text-green-600 border-green-500/30"
      default:
        return "bg-muted text-muted-foreground border-muted"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "manager":
        return "Manager"
      case "colleague":
        return "Colleague"
      case "partner":
        return "Partner"
      case "subordinate":
        return "Subordinate"
      default:
        return role
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="font-sans text-3xl font-bold text-foreground">Employee Evaluation - Start Call</h1>
          <p className="mt-1 font-sans text-sm text-muted-foreground">
            Select an employee to begin automated evaluation calls with their professional contacts
          </p>
        </div>

        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-sans text-xl font-semibold text-card-foreground">
                Select Employee for Evaluation
              </CardTitle>
              <CardDescription>Choose an employee who has at least 2 contacts configured</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {callError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <p className="font-sans text-sm text-destructive">{callError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-sans text-sm font-medium">Employee *</Label>
                <Select onValueChange={handleEmployeeSelect} value={selectedEmployee?.id || ""}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an employee to evaluate" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No employees with 2+ contacts found.
                        <br />
                        Add contacts in Employee Contacts page.
                      </div>
                    ) : (
                      employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{employee.name}</span>
                            <span className="text-xs text-muted-foreground">({employee.contacts.length} contacts)</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmployee && (
                <>
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Employee Information</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 font-medium">{selectedEmployee.name}</span>
                      </div>
                      {selectedEmployee.position && (
                        <div>
                          <span className="text-muted-foreground">Position:</span>
                          <span className="ml-2 font-medium">{selectedEmployee.position}</span>
                        </div>
                      )}
                      {selectedEmployee.email && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="ml-2 font-medium">{selectedEmployee.email}</span>
                        </div>
                      )}
                      {selectedEmployee.department && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Department:</span>
                          <span className="ml-2 font-medium">{selectedEmployee.department}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-sans text-sm font-semibold text-foreground">
                        Contacts to be Called ({selectedEmployee.contacts.length})
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {selectedEmployee.contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-4 bg-background border border-border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-sans font-semibold text-foreground">{contact.name}</span>
                              <Badge variant="outline" className={getRoleBadgeColor(contact.role)}>
                                {getRoleLabel(contact.role)}
                              </Badge>
                              <Badge variant="outline">{contact.language === "ar" ? "Arabic" : "English"}</Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </div>
                          </div>
                          {callingContactIds.has(contact.id) && (
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="text-sm font-medium">Calling...</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      className={
                        notifiedEmployees.has(selectedEmployee.id)
                          ? "flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                          : "flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                      }
                      onClick={handleSendEmailNotification}
                      disabled={isSendingEmail || !selectedEmployee || notifiedEmployees.has(selectedEmployee.id)}
                      size="lg"
                    >
                      {isSendingEmail ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending Email...
                        </>
                      ) : notifiedEmployees.has(selectedEmployee.id) ? (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          Notified ✓
                        </>
                      ) : (
                        <>
                          <Mail className="h-5 w-5" />
                          Email Notification
                        </>
                      )}
                    </Button>

                    <Button
                      className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                      onClick={handleStartEvaluation}
                      disabled={isCallLoading || !selectedEmployee || selectedEmployee.contacts.length === 0}
                      size="lg"
                    >
                      {isCallLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Starting Calls...
                        </>
                      ) : (
                        <>
                          <Phone className="h-5 w-5" />
                          Start Evaluation ({selectedEmployee.contacts.length} Calls)
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-sans text-lg font-semibold text-card-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Live Calls ({liveCalls.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {liveCalls.length === 0 ? (
                <div className="text-center py-8">
                  <PhoneMissed className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No active calls</p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {liveCalls.map((call) => (
                    <div key={call.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{call.customerName}</div>
                          <div className="text-xs text-muted-foreground">{call.phoneNumber}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            call.status === "In Progress"
                              ? "bg-success/20 text-success border-success/30"
                              : "bg-warning/20 text-warning border-warning/30"
                          }
                        >
                          {call.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Duration: {call.duration}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
