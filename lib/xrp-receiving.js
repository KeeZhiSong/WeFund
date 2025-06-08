import xrpl from "xrpl"

export async function XRPReceiving(amount, websiteWallet, charityWallet) {
  function getNet() {
    const net = "wss://s.altnet.rippletest.net:51233"
    return net
  }

  const net = getNet()
  const client = new xrpl.Client(net)
  await client.connect()

  const initialWebsiteBalance = await client.getBalances(websiteWallet.address)
  const initialCharityBalance = await client.getBalances(charityWallet.address)
  console.log("Initial Website balances:", initialWebsiteBalance)
  console.log("Initial Charity balances:", initialCharityBalance)

  const prepared = await client.autofill({
    TransactionType: "Payment",
    Account: websiteWallet.address,
    Amount: amount,
    Destination: charityWallet.address,
  })

  const signed = websiteWallet.sign(prepared)
  console.log("Preparing to send money to charity...")
  const tx = await client.submitAndWait(signed.tx_blob)
  console.log("Result:", tx.result)

  const finalWebsiteBalance = await client.getBalances(websiteWallet.address)
  const finalCharityBalance = await client.getBalances(charityWallet.address)
  console.log("Final Website balances:", finalWebsiteBalance)
  console.log("Final Charity balances:", finalCharityBalance)

  await client.disconnect()

  return {
    "Transaction Result": tx.result,
    "Final Website Balance": finalWebsiteBalance,
    "Final Charity Balance": finalCharityBalance,
  }
}
