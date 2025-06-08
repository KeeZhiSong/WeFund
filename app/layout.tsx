import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { DebugFirebase } from "@/components/debug-firebase"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "XRPL Crowdfunding Platform",
  description: "A crowdfunding platform built on the XRP Ledger",
  generator: 'Next.js'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <DebugFirebase />
        </AuthProvider>
      </body>
    </html>
  )
}
