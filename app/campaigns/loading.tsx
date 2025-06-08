import { Sidebar } from "@/components/sidebar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function CampaignsLoading() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600">Loading campaigns...</p>
        </div>
      </div>
    </div>
  )
}
