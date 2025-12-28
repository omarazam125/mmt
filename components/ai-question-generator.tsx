"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Sparkles, MessageSquare, Send, Plus } from "lucide-react"
import { getRandomQuestionGroup } from "@/lib/question-groups"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface AIQuestionGeneratorProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder: string
  required?: boolean
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  isQuestions?: boolean
}

export function AIQuestionGenerator({ value, onChange, label, placeholder, required }: AIQuestionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const randomGroup = getRandomQuestionGroup()
      const questionsText = randomGroup.questions.join("\n")
      onChange(questionsText)
      setIsGenerating(false)
    }, 500)
  }

  const handleOpenChat = () => {
    const currentQuestions = value.trim() || getRandomQuestionGroup().questions.join("\n")

    if (!value.trim()) {
      onChange(currentQuestions)
    }

    setChatMessages([
      {
        role: "assistant",
        content: currentQuestions,
        isQuestions: true,
      },
    ])
    setShowChat(true)
  }

  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const newUserMessage: ChatMessage = {
      role: "user",
      content: userInput,
    }

    setChatMessages((prev) => [...prev, newUserMessage])
    setUserInput("")
    setIsSendingMessage(true)

    try {
      const response = await fetch("/api/gemini/chat-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatMessages, newUserMessage],
          sessionId: sessionId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate questions")
      }

      const data = await response.json()

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.questions,
        isQuestions: true,
      }

      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "عذراً، لم أستطع توليد الأسئلة. الرجاء المحاولة مرة أخرى.",
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleApplyQuestions = (questions: string) => {
    onChange(questions)
    setShowChat(false)
    setChatMessages([])
    setSessionId("")
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-sans text-sm font-medium">
          {label} {required && "*"}
        </Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleOpenChat} className="gap-2 bg-transparent">
            <MessageSquare className="h-4 w-4" />
            Chat with AI
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2 bg-transparent"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate Questions"}
          </Button>
        </div>
      </div>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[200px] font-sans"
        dir="rtl"
      />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Plus className="h-4 w-4" />
        <span>You can add more questions after automatic generation</span>
      </div>

      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Chat with AI to Customize Questions
            </DialogTitle>
            <DialogDescription>
              Ask the AI to modify questions based on your specific needs. The AI will always generate exactly 5
              questions in Arabic.
            </DialogDescription>
          </DialogHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-muted/20">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border"
                  }`}
                >
                  {message.role === "assistant" && message.isQuestions && (
                    <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-semibold text-muted-foreground">5 أسئلة تم توليدها</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleApplyQuestions(message.content)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        إضافة للنموذج
                      </Button>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed" dir="rtl">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {isSendingMessage && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-[75%] rounded-2xl bg-background border border-border px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t px-6 py-4 bg-background">
            <Input
              placeholder="اكتب هنا..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={isSendingMessage}
              className="flex-1"
              dir="rtl"
            />
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={isSendingMessage || !userInput.trim()}
              className="gap-2 px-6"
            >
              <Send className="h-4 w-4" />
              إرسال
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
