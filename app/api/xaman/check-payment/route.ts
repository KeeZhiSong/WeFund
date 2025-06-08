import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payloadId = searchParams.get("id")

    if (!payloadId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing payload ID",
        },
        { status: 400 },
      )
    }

    const apiKey = "f643fc4d-2f1e-4582-8ced-87d240ca32ab"
    const apiSecret = "09aa96fc-54d4-47ef-81f8-16f813f60cef"

    console.log("Checking payment status for payload:", payloadId)

    const response = await fetch(`https://xumm.app/api/v1/platform/payload/${payloadId}`, {
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
    })

    if (!response.ok) {
      console.error("Failed to check payload status:", response.status)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to check payment status",
        },
        { status: 500 },
      )
    }

    const result = await response.json()
    console.log("Payment status result:", JSON.stringify(result, null, 2))

    return NextResponse.json({
      success: true,
      status: {
        resolved: result.meta.resolved,
        signed: result.meta.signed,
        cancelled: result.meta.cancelled,
        expired: result.meta.expired,
        txid: result.response?.txid,
        account: result.response?.account,
        // Include the signed transaction blob if available
        tx_blob: result.response?.hex,
        dispatched_result: result.response?.dispatched_result,
      },
    })
  } catch (error) {
    console.error("Check payment error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
