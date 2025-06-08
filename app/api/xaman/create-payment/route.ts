import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { destination, amount, memo } = await request.json()

    console.log("Creating payment with:", { destination, amount, memo })

    if (!destination || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use direct API call instead of SDK
    const apiKey = "f643fc4d-2f1e-4582-8ced-87d240ca32ab"
    const apiSecret = "09aa96fc-54d4-47ef-81f8-16f813f60cef"

    const payload = {
      txjson: {
        TransactionType: "Payment",
        Destination: destination,
        Amount: String(Math.floor(amount * 1000000)), // Convert XRP to drops
      },
      options: {
        submit: false, // ← Changed to false to receive signed payload
        return_url: {
          web: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/donate/success?id={id}&txid={txid}`,
        },
      },
      custom_meta: {
        instruction: memo || "Thank you for your donation!",
        blob: {
          purpose: "crowdfunding_donation",
          platform: "wefund",
        },
      },
    }

    console.log("Sending payload to Xaman API (submit: false):", JSON.stringify(payload, null, 2))

    const response = await fetch("https://xumm.app/api/v1/platform/payload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("Xaman API Response:", response.status, responseText)

    if (!response.ok) {
      console.error("Xaman API request failed:", response.status, responseText)

      // Handle rate limiting specifically
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(responseText)
          if (errorData.error?.code === 429) {
            return NextResponse.json(
              {
                success: false,
                error: "Rate limit exceeded",
                details: "Too many payment requests. Please wait a few minutes before trying again.",
                retryAfter: 300, // 5 minutes
              },
              { status: 429 },
            )
          }
        } catch (parseError) {
          // Continue with original error handling if parsing fails
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create payment payload",
          details: responseText,
        },
        { status: 500 },
      )
    }

    const result = JSON.parse(responseText)

    if (!result || !result.refs) {
      console.error("Invalid Xaman API response structure:", result)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from payment service",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      payload: {
        uuid: result.uuid,
        refs: {
          qr_png: result.refs.qr_png,
        },
        next: {
          always: result.next.always,
        },
      },
    })
  } catch (error) {
    console.error("Create payment error:", error)
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
