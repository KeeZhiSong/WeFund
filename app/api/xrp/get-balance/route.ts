import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ success: false, error: "Missing address parameter" }, { status: 400 })
    }

    // Query XRPL testnet for account info
    const xrplResponse = await fetch("https://s.altnet.rippletest.net:51234/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "account_info",
        params: [
          {
            account: address,
            ledger_index: "validated",
          },
        ],
      }),
    })

    if (!xrplResponse.ok) {
      throw new Error(`XRPL API error: ${xrplResponse.status}`)
    }

    const xrplData = await xrplResponse.json()

    if (xrplData.result?.account_data) {
      const balance = xrplData.result.account_data.Balance
      const xrpBalance = (Number.parseInt(balance) / 1000000).toString() // Convert drops to XRP

      return NextResponse.json({
        success: true,
        address: address,
        balance: xrpBalance,
        balances: [
          {
            currency: "XRP",
            value: xrpBalance,
          },
        ],
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Account not found or invalid",
        details: xrplData.result,
      })
    }
  } catch (error) {
    console.error("Error getting balance:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get balance",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
