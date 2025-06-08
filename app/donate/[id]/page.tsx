"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Shield, Wallet, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Sidebar } from "@/components/sidebar"
import { EmailVerificationBanner } from "@/components/email-verification-banner"
import { useAuth } from "@/contexts/auth-context"
import { CampaignService } from "@/services/firebase-campaigns"
import type { Campaign } from "@/types/database"

// Helper function to store donation in localStorage
const storeLocalDonation = (donation: any) => {
  try {
    localStorage.setItem(
      "lastDonation",
      JSON.stringify({
        ...donation,
        timestamp: new Date().toISOString(),
      }),
    )
    return true
  } catch (error) {
    console.error("Failed to store donation in localStorage:", error)
    return false
  }
}

// Helper function to update UI campaign stats
const updateUICampaignStats = (campaign: Campaign, amount: number): Campaign => {
  return {
    ...campaign,
    raised: (campaign.raised || 0) + amount,
    donors: (campaign.donors || 0) + 1,
  }
}

export default function DonatePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [donationAmount, setDonationAmount] = useState<number>(10)
  const [message, setMessage] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [payloadUrl, setPayloadUrl] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [payloadId, setPayloadId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string>("pending")
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false)
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false)

  const campaignId = params.id as string

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true)
        setError(null)
        const campaignData = await CampaignService.getCampaignById(campaignId)
        setCampaign(campaignData)
      } catch (error) {
        console.error("Error fetching campaign:", error)
        setError("Failed to load campaign details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (campaignId) {
      fetchCampaign()
    }
  }, [campaignId])

  // Check payload status periodically if we have a payload ID
  useEffect(() => {
    const checkStatus = async () => {
      if (!payloadId || isFallbackMode) return

      try {
        const response = await fetch(`/api/xaman/check-payment?id=${payloadId}`)

        if (!response.ok) {
          console.error("Payment check failed:", response.status, response.statusText)
          return
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Invalid response type:", contentType)
          return
        }

        const data = await response.json()
        console.log("Payment status data:", data)

        if (data.success && data.status.resolved) {
          if (data.status.signed && data.status.tx_blob) {
            // Prevent duplicate processing
            if (isProcessingTransaction) {
              console.log("Transaction already being processed, skipping...")
              return
            }

            setIsProcessingTransaction(true)
            setPaymentStatus("processing")
            setDebugInfo(`Received signed transaction: ${data.status.tx_blob.substring(0, 50)}...`)

            // Process the signed payload through our XRP functions
            try {
              console.log("Sending to process-signed-payload:", {
                tx_blob: data.status.tx_blob,
                amount: donationAmount,
                campaignId: campaign?.id,
              })

              const processResponse = await fetch("/api/xrp/process-signed-payload", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  tx_blob: data.status.tx_blob,
                  amount: donationAmount,
                  campaignId: campaign?.id,
                }),
              })

              console.log("Process response status:", processResponse.status)

              // Read the response body once and handle both success and error cases
              const responseText = await processResponse.text()
              console.log("Process response text:", responseText)

              if (!processResponse.ok) {
                // Try to parse as JSON for error details
                let errorDetails = `HTTP ${processResponse.status}`
                try {
                  const errorData = JSON.parse(responseText)
                  errorDetails = errorData.details || errorData.error || errorDetails
                  console.error("Process error details:", errorData)
                  setDebugInfo(`Process failed: ${JSON.stringify(errorData, null, 2)}`)
                } catch (parseError) {
                  console.error("Process error text:", responseText)
                  setDebugInfo(`Process failed: ${responseText}`)
                }
                throw new Error(`Process response not ok: ${errorDetails}`)
              }

              // Parse successful response
              let processData
              try {
                processData = JSON.parse(responseText)
              } catch (parseError) {
                console.error("Failed to parse success response:", responseText)
                throw new Error("Invalid JSON response from server")
              }

              console.log("Process result:", processData)

              if (processData.success) {
                setPaymentStatus("completed")
                setSuccess(true)
                setDebugInfo(
                  `Transaction completed!\nDonation TX: ${processData.donationTx?.hash || "N/A"}\nForward TX: ${processData.forwardTx?.hash || "N/A"}${processData.forwardError ? `\nForward Error: ${processData.forwardError}` : ""}\n${processData.simulation ? "⚠️ SIMULATION MODE" : ""}`,
                )

                // Record the donation and update UI
                if (campaign) {
                  const donationData = {
                    campaignId: campaign.id,
                    donorId: user?.uid || "anonymous",
                    amount: donationAmount,
                    message: message,
                    transactionHash: processData.donationTx?.hash || data.status.txid || "unknown",
                    walletAddress: data.status.account || "unknown",
                    forwardTransactionHash: data.status.forwardTx?.hash || "unknown",
                  }

                  // Store locally first as backup
                  storeLocalDonation(donationData)

                  // Update UI optimistically
                  setCampaign((prev) => (prev ? updateUICampaignStats(prev, donationAmount) : prev))

                  // Try to record in Firebase
                  try {
                    CampaignService.recordDonation(donationData).catch((err) =>
                      console.error("Background donation recording failed:", err),
                    )
                  } catch (err) {
                    console.error("Error initiating donation recording:", err)
                  }
                }

                // Redirect after successful donation
                setTimeout(() => {
                  router.push(`/campaigns/${campaign?.id}?donated=true`)
                }, 3000)
              } else {
                setPaymentStatus("error")
                setError(`Failed to process signed transaction: ${processData.error}`)
                setDebugInfo(`Processing failed: ${JSON.stringify(processData, null, 2)}`)
              }
            } catch (processError) {
              console.error("Error processing signed payload:", processError)
              setPaymentStatus("error")
              setError(
                `Failed to process signed transaction: ${processError instanceof Error ? processError.message : String(processError)}`,
              )
            } finally {
              // Always reset the processing flag
              setIsProcessingTransaction(false)
            }
          } else if (data.status.cancelled) {
            setPaymentStatus("rejected")
            setError("The payment request was cancelled.")
          } else if (data.status.expired) {
            setPaymentStatus("expired")
            setError("The payment request has expired.")
          }
        }
      } catch (error) {
        console.error("Error checking payment status:", error)
      }
    }

    const interval = setInterval(checkStatus, 2000)
    return () => clearInterval(interval)
  }, [payloadId, campaign, donationAmount, message, user, router, isFallbackMode, isProcessingTransaction])

  const testXamanConnection = async () => {
    try {
      setDebugInfo("Testing Xaman connection...")
      const response = await fetch("/api/xaman/test")
      const data = await response.json()
      setDebugInfo(JSON.stringify(data, null, 2))
    } catch (error) {
      setDebugInfo(`Test failed: ${error}`)
    }
  }

  const testXRPAPI = async () => {
    try {
      setDebugInfo("Testing XRP API...")

      // Test GET endpoint
      const getResponse = await fetch("/api/xrp/test")
      const getData = await getResponse.json()

      // Test POST endpoint with sample data
      const postResponse = await fetch("/api/xrp/process-signed-payload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_blob: "sample_tx_blob_for_testing",
          amount: 10,
          campaignId: "test_campaign",
        }),
      })

      const postText = await postResponse.text()
      let postData
      try {
        postData = JSON.parse(postText)
      } catch (e) {
        postData = { error: "Failed to parse response", text: postText }
      }

      setDebugInfo(`GET Test: ${JSON.stringify(getData, null, 2)}\n\nPOST Test: ${JSON.stringify(postData, null, 2)}`)
    } catch (error) {
      setDebugInfo(`XRP API Test failed: ${error}`)
    }
  }

  const checkWalletBalances = async () => {
    try {
      setDebugInfo("Checking wallet balances...")
      const response = await fetch("/api/xrp/check-balances")
      const data = await response.json()

      if (data.success) {
        const websiteXRP = data.balances.website.balances.find((b) => b.currency === "XRP")?.value || "0"
        const charityXRP = data.balances.charity.balances.find((b) => b.currency === "XRP")?.value || "0"

        setDebugInfo(`Wallet Balances:
Website Wallet (${data.balances.website.address}): ${websiteXRP} XRP
Charity Wallet (${data.balances.charity.address}): ${charityXRP} XRP

Last Updated: ${data.timestamp}`)
      } else {
        setDebugInfo(`Balance check failed: ${data.error}`)
      }
    } catch (error) {
      setDebugInfo(`Balance check error: ${error}`)
    }
  }

  const debugXRPIntegration = async () => {
    try {
      setDebugInfo("Running XRP integration debug...")
      const response = await fetch("/api/xrp/debug")
      const data = await response.json()
      setDebugInfo(JSON.stringify(data, null, 2))
    } catch (error) {
      setDebugInfo(`Debug failed: ${error}`)
    }
  }

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!campaign) return
    if (!donationAmount || donationAmount <= 0) {
      setError("Please enter a valid donation amount")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const donationData = {
        campaignId: campaign.id,
        donorId: user?.uid || "anonymous",
        amount: donationAmount,
        message: message,
        transactionHash: `mock-tx-${Math.random().toString(36).substring(2, 15)}`,
        walletAddress: user?.walletAddress || "unknown",
      }

      // Store locally first as backup
      storeLocalDonation(donationData)

      // Update UI optimistically
      setCampaign((prev) => (prev ? updateUICampaignStats(prev, donationAmount) : prev))

      // Try to record in Firebase, but don't wait for it
      try {
        CampaignService.recordDonation(donationData).catch((err) =>
          console.error("Background donation recording failed:", err),
        )
      } catch (err) {
        console.error("Error initiating donation recording:", err)
      }

      setSuccess(true)

      setTimeout(() => {
        router.push(`/campaigns/${campaign.id}?donated=true`)
      }, 2000)
    } catch (error) {
      console.error("Donation error:", error)
      setError("Failed to process donation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleXamanDonation = async () => {
    if (!campaign) {
      setError("Campaign not found")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setPaymentStatus("pending")
      setDebugInfo("Generating QR code for signed payload...")

      console.log("Starting Xaman donation process for campaign:", campaign.id)

      // Create payment to website wallet (submit: false to get signed payload)
      const response = await fetch("/api/xaman/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: "rPC5LX8Pc7cN7MadBsBdgA7NQuaZQM2wV4", // Website wallet
          amount: donationAmount,
          memo: `Campaign: ${campaign.id} - ${message || "Anonymous donation"}`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDebugInfo(JSON.stringify(data, null, 2))

        if (data.success && data.payload) {
          setPayloadId(data.payload.uuid)
          setQrCodeUrl(data.payload.refs?.qr_png)
          setPayloadUrl(data.payload.next?.always)
          setIsFallbackMode(false)
          return
        }
      } else if (response.status === 429) {
        // Handle rate limiting
        const errorData = await response.json()
        setError("Rate limit exceeded. Please wait a few minutes before trying again.")
        setDebugInfo(`Rate limited: ${JSON.stringify(errorData, null, 2)}`)
        return
      }

      // If main API fails, use fallback
      console.log("Main API failed, using fallback QR generation...")
      setDebugInfo("Main API failed, using fallback QR generation...")

      const fallbackResponse = await fetch("/api/xaman/fallback-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          amount: donationAmount,
        }),
      })

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        setDebugInfo(JSON.stringify(fallbackData, null, 2))

        if (fallbackData.success) {
          setPayloadId(fallbackData.qrData.payloadId)
          setQrCodeUrl(fallbackData.qrData.qrUrl)
          setPayloadUrl(fallbackData.qrData.payloadUrl)
          setIsFallbackMode(true)
          return
        }
      }

      throw new Error("Both main and fallback QR generation failed")
    } catch (error) {
      console.error("Xaman QR generation error:", error)
      setError(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`)
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
              <div className="h-64 bg-slate-200 rounded-lg mb-6"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-32 bg-slate-200 rounded mb-6"></div>
              <div className="h-12 bg-slate-200 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Campaign Not Found</h1>
            <p className="text-slate-600 mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
            <Link href="/campaigns">
              <Button className="text-white" style={{ backgroundColor: "#3CAEA3" }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Campaigns
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const progressPercentage = Math.min((campaign.raised / campaign.goal) * 100, 100)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Link
              href={`/campaigns/${campaign.id}`}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Campaign</span>
            </Link>
          </div>

          <EmailVerificationBanner />

          {success ? (
            <Card className="bg-white border-green-200 mb-6">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-700 mb-2">Thank You!</h2>
                <p className="text-green-600 mb-4">Your donation has been processed successfully.</p>
                <p className="text-slate-600">Funds have been forwarded to the charity wallet.</p>
                <p className="text-slate-600">You will be redirected to the campaign page shortly.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-800 mb-6">Donate to {campaign.title}</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2">
                  <Card className="bg-white border-slate-200 mb-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Campaign Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                          <Image
                            src={campaign.image || "/placeholder.svg?height=80&width=80"}
                            alt={campaign.title}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-800">{campaign.title}</h3>
                          <p className="text-sm text-slate-600 line-clamp-2">{campaign.description}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Raised</span>
                          <span className="text-slate-800 font-medium">
                            {(campaign.raised || 0).toLocaleString()} XRP
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Goal: {(campaign.goal || 0).toLocaleString()} XRP</span>
                          <span className="font-medium" style={{ color: "#3CAEA3" }}>
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-slate-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Make Your Donation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
                          {error}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="xaman-amount">Donation Amount (XRP)</Label>
                          <div className="mt-1 relative">
                            <Input
                              id="xaman-amount"
                              type="number"
                              step="0.1"
                              value={donationAmount}
                              onChange={(e) => setDonationAmount(Number.parseFloat(e.target.value))}
                              className="pl-8"
                              required
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-slate-500 sm:text-sm">₽</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {[10, 25, 50, 100].map((amount) => (
                            <Button
                              key={amount}
                              type="button"
                              variant="outline"
                              className={`flex-1 ${donationAmount === amount ? "border-teal-500 bg-teal-50 text-teal-700" : ""}`}
                              onClick={() => setDonationAmount(amount)}
                            >
                              {amount} XRP
                            </Button>
                          ))}
                        </div>

                        <div>
                          <Label htmlFor="xaman-message">Message (Optional)</Label>
                          <Textarea
                            id="xaman-message"
                            placeholder="Add a message of support..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                        </div>

                        {qrCodeUrl ? (
                          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                            {isFallbackMode && (
                              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-md mb-4 text-sm flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Using fallback QR code. Manual verification may be required.
                              </div>
                            )}
                            <div className="text-center mb-4">
                              <h3 className="font-medium text-slate-800 mb-2">Scan with Xaman App</h3>
                              <p className="text-sm text-slate-600 mb-4">
                                Scan this QR code to sign the transaction. We'll process it through our platform.
                              </p>
                              <div className="flex justify-center mb-4">
                                <img
                                  src={qrCodeUrl || "/placeholder.svg"}
                                  alt="Xaman Payment QR Code"
                                  width={200}
                                  height={200}
                                  className="border border-slate-200 rounded-md"
                                />
                              </div>
                              {payloadUrl && (
                                <div className="flex justify-center">
                                  <a
                                    href={payloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 rounded-md text-white"
                                    style={{ backgroundColor: "#3CAEA3" }}
                                  >
                                    <Wallet className="w-4 h-4 mr-2" />
                                    Open in Xaman App
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="text-center text-sm">
                              {paymentStatus === "pending" && (
                                <p className="text-amber-600">Waiting for you to sign the transaction...</p>
                              )}
                              {paymentStatus === "processing" && (
                                <p className="text-blue-600">Processing signed transaction through our platform...</p>
                              )}
                              {paymentStatus === "completed" && (
                                <p className="text-green-600">Transaction completed and forwarded to charity!</p>
                              )}
                              {paymentStatus === "rejected" && (
                                <p className="text-red-600">Transaction was rejected or cancelled.</p>
                              )}
                              {paymentStatus === "expired" && (
                                <p className="text-red-600">Transaction request has expired.</p>
                              )}
                              {paymentStatus === "error" && (
                                <p className="text-red-600">An error occurred during transaction processing.</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            onClick={handleXamanDonation}
                            className="w-full text-white font-medium py-3"
                            style={{ backgroundColor: "#FF6F61" }}
                            size="lg"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Generating QR Code..." : "Pay with Xaman"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Debug Information */}
                  {debugInfo && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                      <h3 className="text-sm font-medium mb-2">Debug Information:</h3>
                      <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-800 text-white rounded whitespace-pre-wrap">
                        {debugInfo}
                      </pre>
                    </div>
                  )}
                </div>

                <div>
                  <Card className="bg-white border-slate-200 mb-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">How It Works</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 text-sm text-slate-600">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            1
                          </div>
                          <p>Select your donation amount and scan QR code</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            2
                          </div>
                          <p>Sign the transaction in your Xaman app</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            3
                          </div>
                          <p>We receive your signed transaction and submit it</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            4
                          </div>
                          <p>Funds are automatically forwarded to the charity</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-green-800 mb-2">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Secure Donation</span>
                      </div>
                      <p className="text-xs text-green-700">
                        Your transaction is signed by you and processed through our secure platform before being
                        forwarded to the charity.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
