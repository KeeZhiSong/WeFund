"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Donation } from "@/types/database"
import { ArrowUpRight, ArrowDownLeft, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"

interface TransactionCardProps {
  transaction: Donation
  userId: string
}

export function TransactionCard({ transaction, userId }: TransactionCardProps) {
  const isSent = transaction.donorId === userId

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`${label} copied to clipboard`)
  }

  const formatDate = (timestamp: any) => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-full ${isSent ? "bg-red-100" : "bg-green-100"}`}>
              {isSent ? (
                <ArrowUpRight className={`h-4 w-4 ${isSent ? "text-red-600" : "text-green-600"}`} />
              ) : (
                <ArrowDownLeft className={`h-4 w-4 ${isSent ? "text-red-600" : "text-green-600"}`} />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-lg">{isSent ? "Sent" : "Received"}</h3>
                <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                  {transaction.status}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-2">{formatDate(transaction.createdAt)}</p>

              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Campaign:</span>{" "}
                  <Link href={`/campaigns/${transaction.campaignId}`} className="text-blue-600 hover:underline">
                    {transaction.campaignTitle || "Unknown Campaign"}
                  </Link>
                </p>

                {transaction.transactionHash && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Hash:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {truncateAddress(transaction.transactionHash)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.transactionHash!, "Transaction hash")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {transaction.walletAddress && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">Wallet:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {truncateAddress(transaction.walletAddress)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.walletAddress!, "Wallet address")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className={`text-xl font-bold ${isSent ? "text-red-600" : "text-green-600"}`}>
              {isSent ? "-" : "+"}${transaction.amount.toFixed(2)} XRP
            </p>

            {transaction.transactionHash && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  window.open(`https://livenet.xrpl.org/transactions/${transaction.transactionHash}`, "_blank")
                }
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on XRPL
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
