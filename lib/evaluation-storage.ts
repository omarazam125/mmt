export interface EvaluationTranscript {
  callId: string
  employeeId: string
  employeeName: string
  employeePosition?: string
  respondentName?: string
  respondentRole?: string
  contactName?: string
  transcript: string
  duration: number
  createdAt: string
  status?: string
  phoneNumber?: string
}

const STORAGE_KEY = "evaluation_transcripts"

export function saveEvaluationTranscript(data: EvaluationTranscript): void {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    const transcripts: Record<string, EvaluationTranscript[]> = existing ? JSON.parse(existing) : {}

    if (!transcripts[data.employeeId]) {
      transcripts[data.employeeId] = []
    }

    // Check if already exists
    const existingIndex = transcripts[data.employeeId].findIndex((t) => t.callId === data.callId)

    if (existingIndex === -1) {
      transcripts[data.employeeId].push(data)
    } else {
      transcripts[data.employeeId][existingIndex] = data
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(transcripts))
    console.log("[v0] Saved evaluation transcript for:", data.employeeName, "Call:", data.callId)
  } catch (error) {
    console.error("[v0] Error saving evaluation transcript:", error)
  }
}

export function getEvaluationTranscripts(): Record<string, EvaluationTranscript[]> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error("[v0] Error loading evaluation transcripts:", error)
    return {}
  }
}

export function getTranscriptsByEmployeeId(employeeId: string): EvaluationTranscript[] {
  const all = getEvaluationTranscripts()
  return all[employeeId] || []
}

export function getTranscriptsByEmployeeName(employeeName: string): EvaluationTranscript[] {
  const all = getEvaluationTranscripts()
  const results: EvaluationTranscript[] = []

  Object.values(all).forEach((transcripts) => {
    transcripts.forEach((t) => {
      if (t.employeeName.toLowerCase() === employeeName.toLowerCase()) {
        results.push(t)
      }
    })
  })

  return results
}

export function getAllEvaluatedEmployees(): { employeeId: string; employeeName: string; transcriptCount: number }[] {
  const transcripts = getEvaluationTranscripts()
  const results: { employeeId: string; employeeName: string; transcriptCount: number }[] = []

  Object.entries(transcripts).forEach(([employeeId, employeeTranscripts]) => {
    if (employeeTranscripts.length > 0) {
      results.push({
        employeeId,
        employeeName: employeeTranscripts[0].employeeName,
        transcriptCount: employeeTranscripts.length,
      })
    }
  })

  return results
}
