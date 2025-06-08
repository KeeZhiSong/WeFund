import { type NextRequest, NextResponse } from "next/server"
import { checkDonationStatus } from "@/lib/xaman-platform"

export async function GET(request: NextRequest) {
  try {
    const payloadId = request.nextUrl.searchParams.get("id")

    if (!payloadId) {
      return NextResponse.json({ error: "Missing required parameter: id" }, { status: 400 })
    }

    const status = await checkDonationStatus(payloadId)

    if (!status) {
      return NextResponse.json({ error: "Failed to check donation status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error("Check donation error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
