import { type NextRequest, NextResponse } from "next/server"
import { generateDonationQR } from "@/lib/xaman-platform"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, amount, donorInfo } = await request.json()

    console.log("Generate QR API called with:", { campaignId, amount, donorInfo })

    if (!campaignId || !amount) {
      console.error("Missing required fields:", { campaignId, amount })
      return NextResponse.json({ error: "Missing required fields: campaignId and amount" }, { status: 400 })
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      console.error("Invalid amount:", amount)
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 })
    }

    console.log("Calling generateDonationQR...")
    const qrData = await generateDonationQR(campaignId, amount, donorInfo)

    if (!qrData) {
      console.error("generateDonationQR returned null")
      return NextResponse.json({ error: "Failed to generate QR code - SDK returned null" }, { status: 500 })
    }

    console.log("QR generated successfully:", {
      payloadId: qrData.payloadId,
      donationId: qrData.donationId,
      hasQrUrl: !!qrData.qrUrl,
      hasPayloadUrl: !!qrData.payloadUrl,
    })

    return NextResponse.json({
      success: true,
      qrData,
    })
  } catch (error) {
    console.error("Generate QR API error:", error)

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
