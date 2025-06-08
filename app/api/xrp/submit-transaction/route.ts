import { type NextRequest, NextResponse } from "next/server"

// Simple logging function
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : "")
}

export async function POST(request: NextRequest) {
  try {
    log("=== XRPL Transaction Submission ===")

    const body = await request.json()
    const { tx_blob } = body

    if (!tx_blob) {
      return NextResponse.json({ success: false, error: "Missing transaction blob" }, { status: 400 })
    }

    log("Submitting transaction to XRPL", { tx_blob_length: tx_blob.length })

    // Submit to XRPL testnet using HTTP API
    const xrplResponse = await fetch("https://s.altnet.rippletest.net:51234/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "submit",
        params: [
          {
            tx_blob: tx_blob,
          },
        ],
      }),
    })

    if (!xrplResponse.ok) {
      throw new Error(`XRPL API error: ${xrplResponse.status}`)
    }

    const xrplData = await xrplResponse.json()
    log("XRPL response", xrplData)

    if (xrplData.result?.engine_result === "tesSUCCESS") {
      return NextResponse.json({
        success: true,
        result: xrplData.result,
        hash: xrplData.result.tx_json?.hash,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Transaction failed",
        details: xrplData.result,
      })
    }
  } catch (error) {
    log("Error submitting transaction", { error: error.message })
    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit transaction",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
