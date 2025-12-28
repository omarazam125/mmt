"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { LayoutDashboard, Phone, FileText, Mic, Calendar, Radio, Users } from "lucide-react"

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard }, // Overview
  { name: "Live Calls", href: "/live-calls", icon: Radio }, // Live Calls
  { name: "Employee Contacts", href: "/employee-contacts", icon: Users }, // Employee Contacts
  { name: "Start Call", href: "/calls", icon: Phone }, // Start Call
  { name: "Customer Records", href: "/logs", icon: FileText }, // Customer Records
  { name: "Recordings", href: "/recordings", icon: Mic }, // Recordings
  { name: "Transcripts", href: "/transcripts", icon: FileText }, // Transcripts
  { name: "Scheduling", href: "/scheduling", icon: Calendar }, // Scheduling
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-28 flex-col items-center justify-center border-b border-border px-6 py-4">
        <Image
          src="/images/oman-ministry-logo.png"
          alt="Ministry of Transport, Communications and Information Technology"
          width={180}
          height={90}
          className="object-contain"
          priority
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-card p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="font-sans text-xs font-medium text-card-foreground">System Active</span>
          </div>
          <p className="mt-1 font-sans text-xs text-muted-foreground">Connected</p>
        </div>
      </div>
    </div>
  )
}
