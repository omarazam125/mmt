import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Almoayyed - Customer Service Dashboard",
  description:
    "Professional customer service management dashboard for Yusuf Khalil Almoayyed & Sons - A leading company in the Kingdom of Bahrain",
  generator: "v0.app",
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" dir="ltr" className={`${inter.className} ${jetbrainsMono.className}`}>
      <body className="font-sans">
        <div className="flex h-screen w-full overflow-hidden">
          <Suspense fallback={<div>Loading...</div>}>
            <DashboardSidebar />
            <div className="flex-1 overflow-y-auto">{children}</div>
          </Suspense>
        </div>
      </body>
    </html>
  )
}
