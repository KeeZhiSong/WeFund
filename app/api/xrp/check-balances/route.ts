import { type NextRequest, NextResponse } from "next/server"

// Simple logging function
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : "")
}

// Wallet addresses
const WEBSITE_WALLET_ADDRESS = "rPC5LX8Pc7cN7MadBsBdgA7NQuaZQM2wV4"
const CHARITY_WALLET_ADDRESS = "rErZWR46rsbV3ZmPtb3Z1t7Qpmk9QadaCb"

// Get account balance from XRPL
async function getAccountBalance(address: string) {
  try {
    log("Getting account balance for", { address })

    // Import xrpl dynamically
    const xrpl = await import("xrpl")

    const net = "wss://s.altnet.rippletest.net:51233"
    const client = new xrpl.Client(net)

    await client.connect()

    const balances = await client.getBalances(address)
    log("Retrieved balances", { address, balances })

    await client.disconnect()

    return balances
  } catch (error) {
    log("Error getting balance", { address, error: error.message })
    throw error
  }
}

export async function GET(request: NextRequest) {
  try {
    log("=== Checking Wallet Balances ===")

    // Get balances for both wallets
    const websiteBalance = await getAccountBalance(WEBSITE_WALLET_ADDRESS)
    const charityBalance = await getAccountBalance(CHARITY_WALLET_ADDRESS)

    const response = {
      success: true,
      balances: {
        website: {
          address: WEBSITE_WALLET_ADDRESS,
          balances: websiteBalance,
        },
        charity: {
          address: CHARITY_WALLET_ADDRESS,
          balances: charityBalance,
        },
      },
      timestamp: new Date().toISOString(),
    }

    log("Balance check complete", response)
    return NextResponse.json(response)
  } catch (error) {
    log("Error checking balances", { error: error.message, stack: error.stack })

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check balances",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
