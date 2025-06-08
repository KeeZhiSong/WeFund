"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useState } from "react"
// import { toast } from "@/hooks/use-toast"

interface AddWalletDialogProps {
  onAddWallet: (address: string) => Promise<void>
  isLoading?: boolean
}

export function AddWalletDialog({ onAddWallet, isLoading }: AddWalletDialogProps) {
  const [open, setOpen] = useState(false)
  const [address, setAddress] = useState("")
  const [adding, setAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address.trim()) {
      alert("Please enter a valid wallet address")
      return
    }

    // Basic XRPL address validation (starts with 'r' and is 25-34 characters)
    if (!address.match(/^r[1-9A-HJ-NP-Za-km-z]{24,33}$/)) {
      alert("Please enter a valid XRPL wallet address")
      return
    }

    setAdding(true)
    try {
      await onAddWallet(address.trim())
      setAddress("")
      setOpen(false)
      alert("Your wallet has been successfully connected")
    } catch (error) {
      alert(`Failed to add wallet: ${error instanceof Error ? error.message : "An error occurred"}`)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add XRPL Wallet</DialogTitle>
            <DialogDescription>
              Connect a new XRPL wallet address to your account. Make sure you own this wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address">Wallet Address</Label>
              <Input
                id="address"
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={adding || isLoading}
              />
              <p className="text-xs text-slate-600">Enter your XRPL wallet address (starts with 'r')</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button type="submit" disabled={adding || isLoading}>
              {adding ? "Adding..." : "Add Wallet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
