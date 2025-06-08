import { type NextRequest, NextResponse } from "next/server"
import xrpl from "xrpl"

const WEBSITE_WALLET = {
  address: "rPC5LX8Pc7cN7MadBsBdgA7NQuaZQM2wV4",
  seed: "sEdVe2Qz7HMom5D9zXsgrNjpwirF3We",
}

const CHARITY_WALLET = {
  address: "rh2m94Jg99QPpLC9ubgY5TEgq64osoHXv2",
  seed: "sEd7tqoyCUq3QYUghH8jbwZatNGQSGP",
}

export async function POST(request: NextRequest) {
  try {
    const { signedPayment, amount } = await request.json()

    console.log("Processing XRP donation:", { signedPayment, amount })

    // Connect to XRPL testnet
    const net = "wss://s.altnet.rippletest.net:51233"
    const client = new xrpl.Client(net)
    await client.connect()

    try {
      // Step 1: Submit the signed payment from donor to website wallet
      console.log("Submitting donor payment to website wallet...")
      const donorTx = await client.submitAndWait(signedPayment.tx_blob)
      console.log("Donor transaction result:", donorTx.result)

      if (donorTx.result.meta.TransactionResult !== "tesSUCCESS") {
        throw new Error(`Donor transaction failed: ${donorTx.result.meta.TransactionResult}`)
      }

      // Step 2: Create wallet instances for forwarding
      const websiteWallet = xrpl.Wallet.fromSeed(WEBSITE_WALLET.seed)
      const charityWallet = xrpl.Wallet.fromSeed(CHARITY_WALLET.seed)

      // Step 3: Forward the donation from website wallet to charity wallet
      console.log("Preparing to forward donation to charity...")
      const amountInDrops = String(Math.floor(amount * 1000000))

      const forwardPayment = await client.autofill({
        TransactionType: "Payment",
        Account: websiteWallet.address,
        Amount: amountInDrops,
        Destination: charityWallet.address,
      })

      const signedForward = websiteWallet.sign(forwardPayment)
      console.log("Forwarding payment to charity...")

      const forwardTx = await client.submitAndWait(signedForward.tx_blob)
      console.log("Forward transaction result:", forwardTx.result)

      // Get final balances
      const finalWebsiteBalance = await client.getBalances(websiteWallet.address)
      const finalCharityBalance = await client.getBalances(charityWallet.address)

      console.log("Final website balances:", finalWebsiteBalance)
      console.log("Final charity balances:", finalCharityBalance)

      await client.disconnect()

      return NextResponse.json({
        success: true,
        donorTransaction: donorTx.result,
        forwardTransaction: forwardTx.result,
        finalWebsiteBalance,
        finalCharityBalance,
      })
    } catch (txError) {
      await client.disconnect()
      throw txError
    }
  } catch (error) {
    console.error("XRP donation processing error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process XRP donation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
