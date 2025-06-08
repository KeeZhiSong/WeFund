import { XummSdk } from "xumm-sdk"

// Server-side Xaman SDK instance (uses API secret)
let xummServer: XummSdk | null = null

export const initXamanServerSDK = () => {
  if (!xummServer) {
    xummServer = new XummSdk(
      "f643fc4d-2f1e-4582-8ced-87d240ca32ab", // Updated API Key
      "09aa96fc-54d4-47ef-81f8-16f813f60cef", // Updated API Secret
    )
  }
  return xummServer
}

export const createServerPayload = async (destination: string, amount: number, memo?: string) => {
  const sdk = initXamanServerSDK()
  if (!sdk) return null

  try {
    // Convert amount to drops (1 XRP = 1,000,000 drops)
    const amountInDrops = String(Math.floor(amount * 1000000))

    const payload = {
      txjson: {
        TransactionType: "Payment",
        Destination: "rPC5LX8Pc7cN7MadBsBdgA7NQuaZQM2wV4", // Website wallet
        Amount: amountInDrops,
      },
      options: {
        submit: true,
        return_url: {
          web: process.env.NEXT_PUBLIC_BASE_URL + "/donate/success?id={id}&txid={txid}",
        },
      },
      custom_meta: {
        instruction: memo ? `Donation: ${memo}` : "Thank you for your donation to our campaign!",
        blob: {
          purpose: "crowdfunding_donation",
          platform: "wefund",
          campaign_id: destination,
          charity_wallet: "rErZWR46rsbV3ZmPtb3Z1t7Qpmk9QadaCb",
        },
      },
    }

    return await sdk.payload.create(payload)
  } catch (error) {
    console.error("Error creating server payload:", error)
    return null
  }
}

export const getServerPayloadStatus = async (payloadId: string) => {
  const sdk = initXamanServerSDK()
  if (!sdk) return null

  try {
    return await sdk.payload.get(payloadId)
  } catch (error) {
    console.error("Error getting server payload status:", error)
    return null
  }
}

export const verifyTransaction = async (txHash: string) => {
  const sdk = initXamanServerSDK()
  if (!sdk) return null

  try {
    return await sdk.helpers.getTransaction(txHash)
  } catch (error) {
    console.error("Error verifying transaction:", error)
    return null
  }
}

export const pingXamanAPI = async () => {
  const sdk = initXamanServerSDK()
  if (!sdk) return null

  try {
    return await sdk.ping()
  } catch (error) {
    console.error("Error pinging Xaman API:", error)
    return null
  }
}
