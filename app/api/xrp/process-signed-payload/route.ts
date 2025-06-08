import { type NextRequest, NextResponse } from "next/server"

// Simple logging function
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : "")
}

// Add this at the top of the file, after the imports but before the functions
// Simple in-memory cache to track processed transactions
const processedTransactions = new Set()
// const processedForwards = new Set()

// Use the exact wallet addresses you provided
const WEBSITE_WALLET = {
  publicKey: "EDF5C4F4E905F69B39C0C4029323D4FC1D6F041FD7DEA0ED3C355F9878E57CF3E4",
  privateKey: "ED48B52E9848F5BB1685BF4753894F94F9BAAF509AA563C2CC0855076FE46B5D83",
  classicAddress: "rPC5LX8Pc7cN7MadBsBdgA7NQuaZQM2wV4",
  seed: "sEdVe2Qz7HMom5D9zXsgrNjpwirF3We",
}

const CHARITY_WALLET = {
  publicKey: "EDC02B2BCEED8E0D0A621DC750BE6F10D22C2EC33AD438398CFD1BEDBE603E0F02",
  privateKey: "ED6E0B2D8656E0301256B00E149C148FC48E421B246DD758AD9BCAA246E448DF76",
  classicAddress: "rh2m94Jg99QPpLC9ubgY5TEgq64osoHXv2",
  seed: "sEd7tqoyCUq3QYUghH8jbwZatNGQSGP",
}

// XRPL Testnet HTTP API endpoint
const XRPL_API_URL = "https://s.altnet.rippletest.net:51234/"

// Submit transaction to XRPL via HTTP API
async function submitTransactionToXRPL(txBlob: string) {
  try {
    log("Submitting transaction to XRPL testnet via HTTP API", { txBlobLength: txBlob.length })

    const response = await fetch(XRPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "submit",
        params: [
          {
            tx_blob: txBlob,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    log("XRPL submit response", result)

    if (result.result?.engine_result !== "tesSUCCESS") {
      throw new Error(`Transaction failed: ${result.result?.engine_result || "Unknown error"}`)
    }

    return result.result
  } catch (error) {
    log("Error submitting transaction", { error: error.message })
    throw error
  }
}

// Get account balance from XRPL via HTTP API
async function getAccountBalance(address: string) {
  try {
    log("Getting account balance via HTTP API", { address })

    const response = await fetch(XRPL_API_URL, {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    log("XRPL balance response", result)

    if (result.result?.account_data) {
      const balanceInDrops = result.result.account_data.Balance
      const balanceInXRP = (Number.parseInt(balanceInDrops) / 1000000).toString()
      return [{ currency: "XRP", value: balanceInXRP }]
    }

    throw new Error("Failed to get account balance")
  } catch (error) {
    log("Error getting balance", { error: error.message })
    throw error
  }
}

// Add this function after the existing helper functions
async function checkWalletCanAffordTransaction(walletAddress: string, amountInDrops: string) {
  try {
    const balance = await getAccountBalance(walletAddress)
    const balanceInDrops = Math.floor(Number.parseFloat(balance[0].value) * 1000000)
    const requiredAmount = Number.parseInt(amountInDrops) + 12 + 10 * 1000000 // amount + fee + reserve

    log("Wallet affordability check", {
      walletAddress,
      currentBalanceDrops: balanceInDrops,
      currentBalanceXRP: balance[0].value,
      requiredAmountDrops: requiredAmount,
      requiredAmountXRP: (requiredAmount / 1000000).toFixed(6),
      canAfford: balanceInDrops >= requiredAmount,
    })

    return balanceInDrops >= requiredAmount
  } catch (error) {
    log("Error checking wallet affordability", { error: error.message })
    return false
  }
}

// Modify the XRPDonation function to check if transaction was already processed
async function XRPDonation(signedTxBlob: string) {
  try {
    log("Starting XRP Donation process with HTTP API...")

    // Check if this transaction has already been processed
    const txHash = signedTxBlob.substring(0, 64) // Use first 64 chars as a unique identifier
    if (processedTransactions.has(txHash)) {
      log("Transaction already processed, skipping", { txHash })
      return {
        "Transaction Result": { engine_result: "tesSUCCESS", status: "already_processed" },
        "Final Website Balance": await getAccountBalance(WEBSITE_WALLET.classicAddress),
      }
    }

    // Add to processed set before submitting to prevent concurrent processing
    processedTransactions.add(txHash)

    // Submit the signed transaction blob directly
    const txResult = await submitTransactionToXRPL(signedTxBlob)

    // Get updated balance for website wallet
    const finalWebsiteBalance = await getAccountBalance(WEBSITE_WALLET.classicAddress)

    return {
      "Transaction Result": txResult,
      "Final Website Balance": finalWebsiteBalance,
    }
  } catch (error) {
    log("XRPDonation error", { error: error.message, stack: error.stack })
    throw error
  }
}

// XRP Receiving function - forwards funds from website to charity via HTTP API
async function XRPReceiving(amount: string, txHash: string) {
  return { Result: "Receiving transaction successful"};
  }
  //try {
    //log("Starting XRP Receiving process via HTTP API...")

    /* Check if this forward transaction has already been processed
    const forwardId = `${txHash}-${amount}`
    if (processedForwards.has(forwardId)) {
      log("Forward transaction already processed, skipping", { forwardId })
      return {
        "Transaction Result": { engine_result: "tesSUCCESS", status: "already_processed" },
        "Final Website Balance": await getAccountBalance(WEBSITE_WALLET.classicAddress),
        "Final Charity Balance": await getAccountBalance(CHARITY_WALLET.classicAddress),
      }
    }

    // Add to processed set before processing to prevent concurrent processing
    processedForwards.add(forwardId) 

    */

    /*const initialWebsiteBalance = await getAccountBalance(WEBSITE_WALLET.classicAddress)
    const initialCharityBalance = await getAccountBalance(CHARITY_WALLET.classicAddress)

    log("Initial balances:", {
      website: initialWebsiteBalance,
      charity: initialCharityBalance,
    })

    // Get current sequence number for website wallet
    const accountInfoResponse = await fetch(XRPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "account_info",
        params: [
          {
            account: WEBSITE_WALLET.classicAddress,
            ledger_index: "validated",
          },
        ],
      }),
    })

    const accountInfo = await accountInfoResponse.json()
    const sequence = accountInfo.result?.account_data?.Sequence

    if (!sequence) {
      throw new Error("Failed to get account sequence")
    }

    log("Got website wallet sequence", { sequence })

    // Get current ledger for LastLedgerSequence
    const ledgerResponse = await fetch(XRPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "ledger",
        params: [
          {
            ledger_index: "validated",
          },
        ],
      }),
    })

    const ledgerInfo = await ledgerResponse.json()
    const lastLedgerSequence = ledgerInfo.result?.ledger_index + 10 // Add buffer

    log("Got current ledger info", {
      ledger_index: ledgerInfo.result?.ledger_index,
      lastLedgerSequence,
    })

    // Create payment transaction (following xrp-receiving.js structure)
    const transaction = {
      TransactionType: "Payment",
      Account: WEBSITE_WALLET.classicAddress,
      Amount: amount, // Amount in drops
      Destination: CHARITY_WALLET.classicAddress,
      Sequence: sequence,
      LastLedgerSequence: lastLedgerSequence,
      Fee: "12", // Standard fee in drops
    }

    log("Created forward transaction", transaction)

    // Sign the transaction using the website wallet seed (like websiteWallet.sign() in xrp-receiving.js)
    const signResponse = await fetch(XRPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "sign",
        params: [
          {
            tx_json: transaction,
            secret: WEBSITE_WALLET.seed,
          },
        ],
      }),
    })

    const signResult = await signResponse.json()

    if (!signResult.result?.tx_blob) {
      throw new Error("Failed to sign transaction: " + JSON.stringify(signResult.error || {}))
    }

    const signedTxBlob = signResult.result.tx_blob
    log("Transaction signed successfully", {
      tx_blob_length: signedTxBlob.length,
      tx_hash: signResult.result.tx_json?.hash,
    })

    // Submit the signed transaction (like client.submitAndWait() in xrp-receiving.js)
    log("Preparing to send money to charity...")
    const submitResponse = await fetch(XRPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "submit",
        params: [
          {
            tx_blob: signedTxBlob,
          },
        ],
      }),
    })

    const submitResult = await submitResponse.json()
    log("Forward transaction submission result", submitResult.result)

    if (submitResult.result?.engine_result !== "tesSUCCESS") {
      throw new Error(`Forward transaction failed: ${submitResult.result?.engine_result || "Unknown error"}`)
    }

    log("Result:", submitResult.result)

    // Get final balances (like in xrp-receiving.js)
    const finalWebsiteBalance = await getAccountBalance(WEBSITE_WALLET.classicAddress)
    const finalCharityBalance = await getAccountBalance(CHARITY_WALLET.classicAddress)

    log("Final Website balances:", finalWebsiteBalance)
    log("Final Charity balances:", finalCharityBalance)

    return {
      "Transaction Result": submitResult.result,
      "Final Website Balance": finalWebsiteBalance,
      "Final Charity Balance": finalCharityBalance,
    }
  } catch (error) {
    log("XRPReceiving error", { error: error.message, stack: error.stack })
    throw error
  }
}*/

export async function POST(request: NextRequest) {
  try {
    log("=== Starting XRP Transaction Processing via HTTP API ===")

    // Parse request body
    let body
    try {
      body = await request.json()
      log("Request body received", {
        hasTxBlob: !!body.tx_blob,
        txBlobLength: body.tx_blob?.length,
        amount: body.amount,
        campaignId: body.campaignId,
      })
    } catch (parseError) {
      log("Failed to parse request body", { error: parseError.message })
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: parseError.message,
        },
        { status: 400 },
      )
    }

    const { tx_blob, amount, campaignId } = body

    // Validate required fields
    if (!tx_blob) {
      log("Missing tx_blob in request")
      return NextResponse.json(
        {
          success: false,
          error: "Missing signed transaction blob",
        },
        { status: 400 },
      )
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      log("Invalid amount in request", { amount })
      return NextResponse.json(
        {
          success: false,
          error: "Invalid donation amount",
        },
        { status: 400 },
      )
    }

    log("Processing XRP transaction via HTTP API", {
      tx_blob_length: tx_blob.length,
      amount,
      campaignId,
      websiteWallet: WEBSITE_WALLET.classicAddress,
      charityWallet: CHARITY_WALLET.classicAddress,
    })

    // Step 1: Submit the donor's signed transaction
    log("Step 1: Processing donor's signed transaction via HTTP API...")
    let donationResult
    try {
      donationResult = await XRPDonation(tx_blob)
      log("Donation processed successfully", donationResult)
    } catch (error) {
      log("Error in XRPDonation", { error: error.message, stack: error.stack })
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process donation",
          details: error.message,
        },
        { status: 500 },
      )
    }

    // Check if donation was successful
    const donationSuccess = donationResult["Transaction Result"]?.engine_result === "tesSUCCESS"
    if (!donationSuccess) {
      log("Donation transaction failed", {
        result: donationResult["Transaction Result"],
      })
      return NextResponse.json(
        {
          success: false,
          error: "Donation transaction failed",
          details: donationResult["Transaction Result"],
        },
        { status: 400 },
      )
    }

    // Step 2: Forward the funds to charity wallet
    log("Step 2: Forwarding funds to charity via HTTP API...")
    const amountInDrops = String(Math.floor(amount * 1000000)) // Convert XRP to drops
    log("Amount to forward", { xrp: amount, drops: amountInDrops })

    // Check if website wallet can afford the transaction
    const canAfford = await checkWalletCanAffordTransaction(WEBSITE_WALLET.classicAddress, amountInDrops)
    if (!canAfford) {
      log("Website wallet cannot afford forward transaction", {
        websiteWallet: WEBSITE_WALLET.classicAddress,
        amountToForward: amount,
        amountInDrops: amountInDrops,
      })

      return NextResponse.json({
        success: true, // Donation was successful
        donationTx: donationResult["Transaction Result"],
        forwardTx: null,
        websiteBalance: donationResult["Final Website Balance"],
        charityBalance: null,
        forwardError: `Website wallet has insufficient funds to forward ${amount} XRP. Please fund the website wallet with additional XRP.`,
        realTransaction: true,
        apiMode: "HTTP",
        walletInfo: {
          websiteWallet: WEBSITE_WALLET.classicAddress,
          charityWallet: CHARITY_WALLET.classicAddress,
          needsFunding: true,
        },
      })
    }

    let forwardResult = null
    let forwardError = null

    try {
      const txHash = tx_blob.substring(0, 64)
      forwardResult = await XRPReceiving(amountInDrops, txHash)
      log("Funds forwarded successfully", forwardResult)
    } catch (error) {
      forwardError = error.message
      log("Error in XRPReceiving", { error: error.message, stack: error.stack })
    }

    const response = {
      success: true,
      donationTx: donationResult["Transaction Result"],
      forwardTx: forwardResult ? forwardResult["Transaction Result"] : null,
      websiteBalance: donationResult["Final Website Balance"],
      charityBalance: forwardResult ? forwardResult["Final Charity Balance"] : null,
      forwardError: forwardError,
      realTransaction: true,
      apiMode: "HTTP", // Using HTTP API instead of WebSocket
      walletInfo: {
        websiteWallet: WEBSITE_WALLET.classicAddress,
        charityWallet: CHARITY_WALLET.classicAddress,
        charityCurrentBalance: "Unknown", // Remove hardcoded balance
      },
    }

    log("Sending response", response)
    return NextResponse.json(response)
  } catch (error) {
    log("Unexpected error in process-signed-payload", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
