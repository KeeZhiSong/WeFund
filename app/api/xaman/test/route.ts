import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("Testing Xaman API connection...")

    const apiKey = "d501187c-6862-472b-8be6-a02f68608be0"
    const apiSecret = "6e10503a-f088-40b3-937a-97547d752147"

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "Missing API credentials" }, { status: 500 })
    }

    // Test direct API call instead of SDK
    const testPayload = {
      txjson: {
        TransactionType: "Payment",
        Destination: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
        Amount: "1000000", // 1 XRP in drops
      },
    }

    console.log("Testing direct API call to Xaman...")

    const response = await fetch("https://xumm.app/api/v1/platform/payload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
      body: JSON.stringify(testPayload),
    })

    const responseText = await response.text()
    console.log("Direct API response:", response.status, responseText)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `API Error ${response.status}`,
        details: responseText,
        credentials: {
          hasApiKey: !!apiKey,
          hasApiSecret: !!apiSecret,
          apiKeyLength: apiKey?.length || 0,
        },
      })
    }

    const data = JSON.parse(responseText)

    return NextResponse.json({
      success: true,
      message: "Direct API call successful",
      data: {
        uuid: data.uuid,
        hasRefs: !!data.refs,
        hasQrPng: !!data.refs?.qr_png,
      },
    })
  } catch (error) {
    console.error("Xaman test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
