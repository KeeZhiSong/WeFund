import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, amount } = await request.json()

    if (!campaignId || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const platformWallet = "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"

    // Create a simple XRPL payment URL
    const paymentUrl = `https://xrpl.org/send?to=${platformWallet}&amount=${amount}&dt=${campaignId}`

    // Generate QR code using a public QR service
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`

    const donationId = `fallback-${campaignId}-${Date.now()}`

    return NextResponse.json({
      success: true,
      qrData: {
        qrUrl,
        payloadUrl: paymentUrl,
        payloadId: `fallback-${Date.now()}`,
        donationId,
        isFallback: true,
      },
    })
  } catch (error) {
    console.error("Fallback QR generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate fallback QR code",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
