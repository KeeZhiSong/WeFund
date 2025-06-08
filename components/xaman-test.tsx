"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function XamanTest() {
  const [pingResult, setPingResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testPing = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/xaman/ping")
      const data = await response.json()
      setPingResult(data)
    } catch (error) {
      setPingResult({ error: "Failed to ping Xaman API" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Xaman API Test</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testPing} disabled={loading} className="mb-4">
          {loading ? "Testing..." : "Test Xaman Connection"}
        </Button>

        {pingResult && (
          <div className="bg-gray-100 p-3 rounded text-sm">
            <pre>{JSON.stringify(pingResult, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
