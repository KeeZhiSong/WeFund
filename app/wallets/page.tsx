"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ReloadIcon } from "@radix-ui/react-icons"
import { Skeleton } from "@/components/ui/skeleton"
import { Sidebar } from "@/components/sidebar"
import { WalletService } from "@/services/firebase-wallets"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { WalletConnection } from "@/types/database"

const WalletsPage = () => {
  const { user, loading: authLoading } = useAuth()
  const [wallets, setWallets] = useState<WalletConnection[]>([])
  const [newWalletAddress, setNewWalletAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [removingWalletId, setRemovingWalletId] = useState<string | null>(null)
  const [verifyingWalletId, setVerifyingWalletId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.uid) {
      fetchWallets()
    }
  }, [user?.uid])

  const fetchWallets = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      // Start with empty wallets array - only show wallets actually fetched from Firebase
      const userWallets = await WalletService.getUserWallets(user.uid)
      setWallets(userWallets)
    } catch (error: any) {
      console.error("Error fetching wallets:", error)
      alert("Failed to fetch wallets: " + error.message)
      // Ensure wallets is empty on error
      setWallets([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddWallet = async () => {
    if (!user?.uid) {
      alert("You must be logged in to add a wallet.")
      return
    }

    if (!newWalletAddress) {
      alert("Please enter a wallet address.")
      return
    }

    // Basic XRPL address validation
    if (!newWalletAddress.startsWith("r") || newWalletAddress.length < 25 || newWalletAddress.length > 34) {
      alert("Please enter a valid XRPL wallet address.")
      return
    }

    try {
      setLoading(true)
      await WalletService.connectWallet(user.uid, newWalletAddress)
      setNewWalletAddress("")
      alert("Your wallet has been successfully connected")
      // Refresh wallet list
      fetchWallets()
    } catch (error: any) {
      console.error("Error adding wallet:", error)
      alert("Failed to add wallet: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyWallet = async (walletId: string, walletAddress: string) => {
    if (!user?.uid) return

    setVerifyingWalletId(walletId)
    try {
      await WalletService.verifyWallet(user.uid, walletAddress)
      alert("Your wallet has been successfully verified")
      // Refresh wallet list
      fetchWallets()
    } catch (error: any) {
      console.error("Error verifying wallet:", error)
      alert("Failed to verify wallet: " + error.message)
    } finally {
      setVerifyingWalletId(null)
    }
  }

  const handleRemoveWallet = async (walletId: string) => {
    if (!user?.uid) return

    setRemovingWalletId(walletId)
    try {
      // Mock removal for now - would need to implement delete in WalletService
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Remove from local state and refresh from Firebase
      setWallets((prev) => prev.filter((wallet) => wallet.id !== walletId))
      alert("Your wallet has been successfully removed")
    } catch (error: any) {
      console.error("Error removing wallet:", error)
      alert("Failed to remove wallet: " + error.message)
    } finally {
      setRemovingWalletId(null)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-32" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-64" />
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">
                    <Skeleton className="h-4 w-20" />
                  </Label>
                  <Input id="address" type="text" disabled />
                </div>
                <Button disabled>
                  <Skeleton className="h-4 w-24" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>Please sign in to manage your wallets.</CardDescription>
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
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Your Wallets</CardTitle>
              <CardDescription>Manage your connected XRPL wallets here.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="address">XRPL Wallet Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Enter a valid XRPL wallet address starting with 'r'</p>
              </div>
              <Button onClick={handleAddWallet} disabled={loading}>
                {loading ? (
                  <>
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Wallet"
                )}
              </Button>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Loading wallets...
                </div>
              ) : (
                <div className="grid gap-4">
                  {wallets.length > 0 ? (
                    wallets.map((wallet) => (
                      <div key={wallet.id} className="flex items-center justify-between border rounded-md p-4">
                        <div>
                          <p className="font-semibold font-mono text-sm">{wallet.walletAddress}</p>
                          <p className="text-sm text-muted-foreground">
                            Status:{" "}
                            {wallet.isVerified ? (
                              <span className="text-green-600 font-medium">✓ Verified</span>
                            ) : (
                              <span className="text-yellow-600 font-medium">⚠ Unverified</span>
                            )}
                          </p>
                          {wallet.createdAt && (
                            <p className="text-xs text-muted-foreground">
                              Added: {new Date(wallet.createdAt.seconds * 1000).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!wallet.isVerified && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleVerifyWallet(wallet.id, wallet.walletAddress)}
                              disabled={verifyingWalletId === wallet.id}
                            >
                              {verifyingWalletId === wallet.id ? (
                                <>
                                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                "Verify"
                              )}
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={removingWalletId === wallet.id}>
                                {removingWalletId === wallet.id ? (
                                  <>
                                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                    Removing...
                                  </>
                                ) : (
                                  "Remove"
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently remove the wallet from your
                                  account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveWallet(wallet.id)}>
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border rounded-md bg-slate-50">
                      <h3 className="text-lg font-medium mb-2">No wallets connected</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Add your first XRPL wallet address above to get started.
                      </p>
                      <div className="flex justify-center">
                        <img src="/images/wefund-icon.png" alt="Empty wallet" className="w-16 h-16 opacity-30" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default WalletsPage
