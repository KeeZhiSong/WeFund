import xrpl from "xrpl"

export async function XRPDonation(signedPayment, websiteWallet) {
  function getNet() {
    const net = "wss://s.altnet.rippletest.net:51233"
    return net
  }

  const net = getNet()
  const client = new xrpl.Client(net)
  await client.connect()

  console.log("Signed transaction: ", signedPayment)
  console.log("Receiving money from donor...")
  const tx = await client.submitAndWait(signedPayment.tx_blob)
  console.log("Result:", tx.result)
  const finalWebsiteBalance = await client.getBalances(websiteWallet.address)
  console.log("Final website balances:", finalWebsiteBalance)

  await client.disconnect()

  return {
    "Transaction Result": tx.result,
    "Final Website Balance": finalWebsiteBalance,
  }
}
