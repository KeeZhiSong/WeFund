import { Sidebar } from "@/components/sidebar"

export default function DonationSuccessLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-gradient-to-r from-slate-200 to-slate-300 h-2"></div>
            <div className="p-8">
              <div className="text-center py-8">
                <div className="animate-pulse">
                  <div className="h-16 w-16 bg-slate-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto mb-6"></div>

                  <div className="bg-slate-100 rounded-lg p-4 border border-slate-200 mb-6">
                    <div className="h-5 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded col-span-2"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded col-span-2"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-4 bg-slate-200 rounded"></div>
                        <div className="h-4 bg-slate-200 rounded col-span-2"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <div className="h-10 bg-slate-200 rounded w-32"></div>
                    <div className="h-10 bg-slate-200 rounded w-32"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
