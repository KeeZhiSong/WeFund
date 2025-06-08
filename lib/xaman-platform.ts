// Platform wallet management for centralized donations
export const PLATFORM_WALLET = "rPC5LX8Pc7cN7MadBsBdgA7NQuaZQM2wV4" // Website wallet address
export const CHARITY_WALLET = "rh2m94Jg99QPpLC9ubgY5TEgq64osoHXv2" // Charity wallet address

export const WEBSITE_WALLET_CREDENTIALS = {
  publicKey: "EDF5C4F4E905F69B39C0C4029323D4FC1D6F041FD7DEA0ED3C355F9878E57CF3E4",
  privateKey: "ED48B52E9848F5BB1685BF4753894F94F9BAAF509AA563C2CC0855076FE46B5D83",
  classicAddress: "rPC5LX8Pc7cN7MadBsBdgA7NQuaZQM2wV4",
  seed: "sEdVe2Qz7HMom5D9zXsgrNjpwirF3We",
}

// Charity wallet doesn't need credentials as it's not used for signing
export const CHARITY_WALLET_CREDENTIALS = {
  publicKey: "EDC02B2BCEED8E0D0A621DC750BE6F10D22C2EC33AD438398CFD1BEDBE603E0F02",
  privateKey: "ED6E0B2D8656E0301256B00E149C148FC48E421B246DD758AD9BCAA246E448DF76",
  classicAddress: "rh2m94Jg99QPpLC9ubgY5TEgq64osoHXv2",
  seed: "sEd7tqoyCUq3QYUghH8jbwZatNGQSGP",
}

// Direct API approach instead of SDK
export const generateDonationQR = async (campaignId: string, amount: number, donorInfo?: string) => {
  try {
    const apiKey = "f643fc4d-2f1e-4582-8ced-87d240ca32ab"
    const apiSecret = "09aa96fc-54d4-47ef-81f8-16f813f60cef"

    if (!apiKey || !apiSecret) {
      console.error("Missing Xaman API credentials")
      return null
    }

    // Create a unique identifier for this donation
    const donationId = `donation-${campaignId}-${Date.now()}`

    console.log("Creating payload with direct API call:", {
      campaignId,
      amount,
      donorInfo,
      donationId,
      platformWallet: PLATFORM_WALLET,
    })

    // Create payload using direct API call
    const payload = {
      txjson: {
        TransactionType: "Payment",
        Destination: PLATFORM_WALLET,
        Amount: String(Math.floor(amount * 1000000)), // Convert XRP to drops
      },
      options: {
        submit: true,
        return_url: {
          web: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/donate/success?campaign=${campaignId}&amount=${amount}&donation=${donationId}`,
        },
      },
      custom_meta: {
        instruction: `Donation of ${amount} XRP to campaign ${campaignId}`,
        blob: {
          purpose: "platform_donation",
          campaign_id: campaignId,
          donation_id: donationId,
          amount: amount,
        },
      },
    }

    console.log("Payload to be sent:", JSON.stringify(payload, null, 2))

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
    console.log("API Response:", response.status, responseText)

    if (!response.ok) {
      console.error("API request failed:", response.status, responseText)
      return null
    }

    const result = JSON.parse(responseText)

    if (!result || !result.refs || !result.refs.qr_png) {
      console.error("Invalid API response structure:", result)
      return null
    }

    return {
      qrUrl: result.refs.qr_png,
      payloadUrl: result.next.always,
      payloadId: result.uuid,
      donationId,
    }
  } catch (error) {
    console.error("Error generating donation QR:", error)
    return null
  }
}

export const checkDonationStatus = async (payloadId: string) => {
  try {
    const apiKey = "f643fc4d-2f1e-4582-8ced-87d240ca32ab"
    const apiSecret = "09aa96fc-54d4-47ef-81f8-16f813f60cef"

    const response = await fetch(`https://xumm.app/api/v1/platform/payload/${payloadId}`, {
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
    })

    if (!response.ok) {
      console.error("Failed to check payload status:", response.status)
      return null
    }

    const result = await response.json()

    return {
      resolved: result.meta.resolved,
      signed: result.meta.signed,
      cancelled: result.meta.cancelled,
      expired: result.meta.expired,
      txid: result.response?.txid,
      account: result.response?.account,
    }
  } catch (error) {
    console.error("Error checking donation status:", error)
    return null
  }
}

// Fallback QR generation using a simple payment URL
export const generateFallbackQR = async (campaignId: string, amount: number) => {
  try {
    // Create a simple XRPL payment URL that can be converted to QR
    const paymentUrl = `https://xrpl.org/send?to=${PLATFORM_WALLET}&amount=${amount}&dt=${campaignId}`

    // For now, we'll create a mock QR response
    // In production, you'd use a QR code generation service
    const mockQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentUrl)}`

    return {
      qrUrl: mockQrUrl,
      payloadUrl: paymentUrl,
      payloadId: `fallback-${Date.now()}`,
      donationId: `fallback-${campaignId}-${Date.now()}`,
      isFallback: true,
    }
  } catch (error) {
    console.error("Error generating fallback QR:", error)
    return null
  }
}

export const recordPlatformDonation = async (
  campaignId: string,
  amount: number,
  txid: string,
  donorAddress: string,
  message?: string,
) => {
  console.log("Recording platform donation:", {
    campaignId,
    amount,
    txid,
    donorAddress,
    message,
    timestamp: new Date().toISOString(),
  })

  return true
}
