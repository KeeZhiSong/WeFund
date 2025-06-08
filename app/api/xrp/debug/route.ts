import { type NextRequest, NextResponse } from "next/server"

// Simple logging function
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : "")
}

export async function GET(request: NextRequest) {
  try {
    log("=== XRP Debug Endpoint ===")

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      walletInfo: {
        websiteWallet: {
          address: "rPC5LX8Pc7cN7MadBsBdgA7NQuaZQM2wV4",
          hasSeed: true,
        },
        charityWallet: {
          address: "rErZWR46rsbV3ZmPtb3Z1t7Qpmk9QadaCb",
          hasSeed: true,
          currentBalance: "10 XRP",
          sequenceNumber: 7897613,
        },
      },
    }

    // Test importing XRPL library
    try {
      log("Testing XRPL library import...")
      const xrpl = await import("xrpl")
      debugInfo.xrplLibraryImport = "SUCCESS"
      debugInfo.xrplHasWallet = typeof xrpl.Wallet !== "undefined"
      debugInfo.xrplHasClient = typeof xrpl.Client !== "undefined"
    } catch (error) {
      debugInfo.xrplLibraryImport = "FAILED"
      debugInfo.xrplLibraryError = error.message
    }

    // Test wallet creation
    try {
      log("Testing wallet creation...")
      const xrpl = await import("xrpl")

      const websiteWallet = xrpl.Wallet.fromSeed("sEdVe2Qz7HMom5D9zXsgrNjpwirF3We")
      const charityWallet = xrpl.Wallet.fromSeed("sEd7Fnbjpohm7ST7rou6QJp44mtZPtG")

      debugInfo.walletCreation = "SUCCESS"
      debugInfo.walletAddresses = {
        website: websiteWallet.address,
        charity: charityWallet.address,
        websiteMatches: websiteWallet.address === "rPC5LX8Pc7cN7MadBsBdgA7NQuaZQM2wV4",
        charityMatches: charityWallet.address === "rErZWR46rsbV3ZmPtb3Z1t7Qpmk9QadaCb",
      }
    } catch (error) {
      debugInfo.walletCreation = "FAILED"
      debugInfo.walletCreationError = error.message
    }

    // Test XRPL connection
    try {
      log("Testing XRPL connection...")
      const xrpl = await import("xrpl")

      const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233")
      await client.connect()

      debugInfo.xrplConnection = "SUCCESS"
      debugInfo.connectedToTestnet = true

      await client.disconnect()
    } catch (error) {
      debugInfo.xrplConnection = "FAILED"
      debugInfo.xrplConnectionError = error.message
    }

    log("Debug info collected", debugInfo)

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    log("Debug endpoint error", { error: error.message, stack: error.stack })

    return NextResponse.json(
      {
        success: false,
        error: "Debug endpoint failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
