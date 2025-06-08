import { Sidebar } from "@/components/sidebar"

export default function DonateLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-slate-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-slate-200 rounded mb-6"></div>
            <div className="h-12 bg-slate-200 rounded"></div>
          </div>
        </div>
      </main>
    </div>
  )
}
