import { Sidebar } from "@/components/sidebar"

export default function Loading() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 p-6 space-y-6">Loading...</div>
    </div>
  )
}
