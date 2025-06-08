"use client"

import { useEffect, useState } from "react"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { TransactionService } from "@/services/firebase-transactions"
import type { Donation } from "@/types/database"
import { MoreHorizontal, Calendar, DollarSign, TrendingDown, FileX } from "lucide-react"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

const columns: ColumnDef<Donation>[] = [
  {
    accessorKey: "campaignId",
    header: "Campaign",
    cell: ({ row }) => {
      const donation = row.original
      return (
        <div>
          <div className="font-medium">Campaign #{donation.campaignId.slice(-8)}</div>
          {donation.message && <div className="text-sm text-muted-foreground">{donation.message}</div>}
        </div>
      )
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const donation = row.original
      return (
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-red-500" />
          <span className="text-red-600">-{formatCurrency(donation.amount)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const donation = row.original
      const date = donation.createdAt?.toDate ? donation.createdAt.toDate() : new Date(donation.createdAt)
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "transactionHash",
    header: "Transaction Hash",
    cell: ({ row }) => {
      const hash = row.getValue("transactionHash") as string
      return <div className="font-mono text-sm">{hash ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : "Pending"}</div>
    },
  },
  {
    accessorKey: "walletAddress",
    header: "Wallet",
    cell: ({ row }) => {
      const address = row.getValue("walletAddress") as string
      return (
        <div className="font-mono text-sm">{address ? `${address.slice(0, 8)}...${address.slice(-8)}` : "N/A"}</div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const donation = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(donation.id)}>
              Copy donation ID
            </DropdownMenuItem>
            {donation.transactionHash && (
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(donation.transactionHash)}>
                Copy transaction hash
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Campaign</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export default function TransactionsPage() {
  const { user } = useAuth()
  const [data, setData] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month" | "year">("all")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const transactions = await TransactionService.getUserTransactions(user.uid, "sent", timeFilter)
        setData(transactions)
      } catch (error) {
        console.error("Error fetching transactions:", error)
        setError("Failed to load transaction history")
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [user, timeFilter])

  const filteredData = data.filter(
    (item) =>
      item.campaignId.toLowerCase().includes(search.toLowerCase()) ||
      (item.message && item.message.toLowerCase().includes(search.toLowerCase())),
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Calculate statistics
  const totalDonated = data.reduce((sum, t) => sum + t.amount, 0)
  const totalTransactions = data.length
  const thisMonthTransactions = data.filter((t) => {
    const transactionDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return transactionDate >= startOfMonth
  }).length

  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-full">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please sign in to view your transaction history.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Transaction History</h1>
              <p className="text-muted-foreground">Track your donation and funding history</p>
            </div>
            <div className="flex gap-2">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Time</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totalDonated.toFixed(6)} XRP</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTransactions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thisMonthTransactions}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <Input
              type="search"
              placeholder="Search by campaign ID or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Error State */}
          {error && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
              <CardDescription>A complete record of your donations and transactions.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))}
                </div>
              ) : data.length === 0 ? (
                <div className="text-center py-12">
                  <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't made any donations yet. Start supporting campaigns to see your transaction history here.
                  </p>
                  <Button asChild>
                    <a href="/campaigns">Browse Campaigns</a>
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="h-24 text-center">
                            No transactions found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
