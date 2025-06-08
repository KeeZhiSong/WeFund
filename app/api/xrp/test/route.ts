import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "XRP API is working",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: "XRP API POST is working",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Test failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
