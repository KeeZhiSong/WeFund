"use client"

import { BarChart3, DollarSign, FileText, HelpCircle, Home, Search, Settings, Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: FileText, label: "Campaigns", href: "/campaigns" },
  { icon: Search, label: "Track Donation", href: "/track-donation" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Wallet, label: "XRPL Wallets", href: "/wallets" },
  { icon: DollarSign, label: "Transactions", href: "/transactions" },
]

const supportItems = [
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-slate-200 p-6 shadow-sm">
      <nav className="space-y-2">
        <div className="mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Main Menu</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link key={item.label} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive ? "text-white hover:opacity-90" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                  style={isActive ? { backgroundColor: "#3CAEA3" } : {}}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Support</p>
          {supportItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.label} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive ? "text-white hover:opacity-90" : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                  }`}
                  style={isActive ? { backgroundColor: "#3CAEA3" } : {}}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
