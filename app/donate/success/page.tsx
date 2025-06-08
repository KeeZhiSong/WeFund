"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { CampaignService } from "@/services/firebase-campaigns"

export default function DonationSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [campaignTitle, setCampaignTitle] = useState<string>("")

  const campaignId = searchParams.get("campaign")
  const amount = searchParams.get("amount")
  const txid = searchParams.get("txid")

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      if (!campaignId) {
        setError("Campaign ID not found")
        setLoading(false)
        return
      }

      try {
        const campaign = await CampaignService.getCampaignById(campaignId)
        if (campaign) {
          setCampaignTitle(campaign.title)
        } else {
          setError("Campaign not found")
        }
      } catch (err) {
        console.error("Error fetching campaign:", err)
        setError("Failed to load campaign details")
      } finally {
        setLoading(false)
      }
    }

    fetchCampaignDetails()
  }, [campaignId])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link
              href={campaignId ? `/campaigns/${campaignId}` : "/campaigns"}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Campaign</span>
            </Link>
          </div>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
              <div className="h-64 bg-slate-200 rounded-lg mb-6"></div>
            </div>
          ) : error ? (
            <Card className="bg-white border-red-200 mb-6">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
                <p className="text-red-600 mb-4">{error}</p>
                <Button as={Link} href="/campaigns" className="text-white" style={{ backgroundColor: "#3CAEA3" }}>
                  Browse Campaigns
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="bg-white border-green-200 mb-6">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-700 mb-2">Thank You!</h2>
                  <p className="text-green-600 mb-4">Your donation has been processed successfully.</p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-600">Campaign:</div>
                      <div className="font-medium text-slate-800">{campaignTitle}</div>

                      {amount && (
                        <>
                          <div className="text-slate-600">Amount:</div>
                          <div className="font-medium text-slate-800">{amount} XRP</div>
                        </>
                      )}

                      {txid && (
                        <>
                          <div className="text-slate-600">Transaction ID:</div>
                          <div className="font-medium text-slate-800 flex items-center">
                            <span className="truncate">
                              {txid.slice(0, 10)}...{txid.slice(-6)}
                            </span>
                            <a
                              href={`https://livenet.xrpl.org/transactions/${txid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:text-blue-700"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      as={Link}
                      href={campaignId ? `/campaigns/${campaignId}` : "/campaigns"}
                      className="text-white"
                      style={{ backgroundColor: "#3CAEA3" }}
                    >
                      Return to Campaign
                    </Button>
                    <Button as={Link} href="/campaigns" variant="outline">
                      Browse More Campaigns
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
