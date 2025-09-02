import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "AI Study Platform",
  description: "Learn smarter with AI-powered flashcards and adaptive study tools",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <div className="min-h-screen bg-background text-foreground">
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            {children}
            <Analytics />
          </Suspense>
        </div>
      </body>
    </html>
  )
}
