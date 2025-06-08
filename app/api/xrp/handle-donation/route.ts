import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { payloadId, campaignId, amount } = await request.json()

    console.log("Handling donation:", { payloadId, campaignId, amount })

    if (!payloadId || !campaignId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: payloadId, campaignId, and amount",
        },
        { status: 400 },
      )
    }

    // First, verify the payment was successful
    const apiKey = "d501187c-6862-472b-8be6-a02f68608be0"
    const apiSecret = "6e10503a-f088-40b3-937a-97547d752147"

    const payloadResponse = await fetch(`https://xumm.app/api/v1/platform/payload/${payloadId}`, {
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
        "Content-Type": "application/json",
      },
    })

    if (!payloadResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "Failed to verify payment",
      })
    }

    const payloadData = await payloadResponse.json()

    if (!payloadData.meta?.signed) {
      return NextResponse.json({
        success: false,
        error: "Payment not completed",
      })
    }

    // For now, just return success - we'll implement the XRP forwarding later
    console.log("Payment verified successfully:", payloadData.response?.txid)

    return NextResponse.json({
      success: true,
      message: "Donation processed successfully",
      transactionId: payloadData.response?.txid,
      account: payloadData.response?.account,
    })
  } catch (error) {
    console.error("Handle donation error:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
