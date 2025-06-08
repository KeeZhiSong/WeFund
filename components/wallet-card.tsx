"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, ExternalLink, Shield, Trash2 } from "lucide-react"
import type { WalletConnection } from "@/types/database"

interface WalletCardProps {
  wallet: WalletConnection
  onVerify: (walletAddress: string) => Promise<void>
  onRemove: (walletAddress: string) => Promise<void>
  isLoading?: boolean
}

export function WalletCard({ wallet, onVerify, onRemove, isLoading }: WalletCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Wallet address copied to clipboard")
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  return (
    <Card className={`overflow-hidden ${wallet.isVerified ? "border-green-200" : "border-orange-200"}`}>
      <div className={`h-2 w-full ${wallet.isVerified ? "bg-green-500" : "bg-orange-500"}`} aria-hidden="true"></div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <Badge variant={wallet.isVerified ? "default" : "outline"} className="mb-2">
            {wallet.isVerified ? "Verified" : "Unverified"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(wallet.walletAddress)}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-slate-500">Wallet Address</p>
            <p className="font-mono text-sm break-all">{wallet.walletAddress}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Added On</p>
              <p className="text-sm">{formatDate(wallet.createdAt)}</p>
            </div>
            {wallet.verifiedAt && (
              <div>
                <p className="text-sm font-medium text-slate-500">Verified On</p>
                <p className="text-sm">{formatDate(wallet.verifiedAt)}</p>
              </div>
            )}
          </div>

          {wallet.label && (
            <div>
              <p className="text-sm font-medium text-slate-500">Label</p>
              <p className="text-sm">{wallet.label}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between bg-slate-50 px-6 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`https://livenet.xrpl.org/accounts/${wallet.walletAddress}`, "_blank")}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View on XRPL
        </Button>

        {wallet.isVerified ? (
          <Button variant="outline" size="sm" onClick={() => onRemove(wallet.walletAddress)} disabled={isLoading}>
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onVerify(wallet.walletAddress)}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Shield className="h-3 w-3 mr-1" />
            Verify
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
