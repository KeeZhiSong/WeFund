import { Xumm } from "xumm"

// Initialize the SDK with your updated API credentials
let xumm: Xumm | null = null

export const initXamanSDK = () => {
  if (typeof window !== "undefined" && !xumm) {
    // Your updated Xaman API credentials
    xumm = new Xumm("d501187c-6862-472b-8be6-a02f68608be0")
  }
  return xumm
}

export const createPaymentPayload = async (destination: string, amount: number, memo?: string) => {
  const sdk = initXamanSDK()
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
          web: window.location.origin + "/donate/success?id={id}&txid={txid}",
        },
      },
      custom_meta: {
        instruction: memo ? `Donation: ${memo}` : "Thank you for your donation!",
        blob: {
          purpose: "donation",
          campaign_id: destination,
          charity_wallet: "rErZWR46rsbV3ZmPtb3Z1t7Qpmk9QadaCb",
        },
      },
    }

    return await sdk.payload.create(payload)
  } catch (error) {
    console.error("Error creating payment payload:", error)
    return null
  }
}

export const createAndSubscribeToPayment = async (
  destination: string,
  amount: number,
  memo?: string,
  onPayloadEvent?: (event: any) => void,
) => {
  const sdk = initXamanSDK()
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
          web: window.location.origin + "/donate/success?id={id}&txid={txid}",
        },
      },
      custom_meta: {
        instruction: memo ? `Donation: ${memo}` : "Thank you for your donation!",
        blob: {
          purpose: "donation",
          campaign_id: destination,
          charity_wallet: "rErZWR46rsbV3ZmPtb3Z1t7Qpmk9QadaCb",
        },
      },
    }

    return await sdk.payload.createAndSubscribe(payload, onPayloadEvent)
  } catch (error) {
    console.error("Error creating payment subscription:", error)
    return null
  }
}

export const getPayloadStatus = async (payloadId: string) => {
  const sdk = initXamanSDK()
  if (!sdk) return null

  try {
    return await sdk.payload.get(payloadId)
  } catch (error) {
    console.error("Error getting payload status:", error)
    return null
  }
}

export const authorizeUser = async () => {
  const sdk = initXamanSDK()
  if (!sdk) return false

  try {
    await sdk.authorize()
    return true
  } catch (error) {
    console.error("Error authorizing user:", error)
    return false
  }
}

export const getUserInfo = async () => {
  const sdk = initXamanSDK()
  if (!sdk) return null

  try {
    // Wait for user info to be available
    await sdk.environment.ready

    // Get user account info
    const account = await sdk.user.account
    const name = await sdk.user.name
    const picture = await sdk.user.picture
    const token = await sdk.user.token

    return {
      account,
      name,
      picture,
      token,
    }
  } catch (error) {
    console.error("Error getting user info:", error)
    return null
  }
}
