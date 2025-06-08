import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("Pinging Xaman API...")

    // Use direct API call instead of SDK
    const apiKey = "d501187c-6862-472b-8be6-a02f68608be0"
    const apiSecret = "6e10503a-f088-40b3-937a-97547d752147"

    const response = await fetch("https://xumm.app/api/v1/platform/ping", {
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
    })

    const result = await response.json()
    console.log("Ping result:", result)

    return NextResponse.json({
      success: response.ok,
      data: result,
      status: response.status,
    })
  } catch (error) {
    console.error("Ping error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to ping Xaman API",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
