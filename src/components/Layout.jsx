import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar.jsx'

export default function Layout() {
  // Single state drives both mobile drawer and desktop collapse
  const [open, setOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar
          Mobile:  slide in/out via translate (overlay, doesn't affect layout)
          Desktop: collapse width to 0 so main content expands to fill the gap
      */}
      <div className={`
        fixed inset-y-0 left-0 z-30
        lg:static lg:z-auto lg:shrink-0
        transition-all duration-200 overflow-hidden
        ${open ? 'translate-x-0 lg:w-48' : '-translate-x-full lg:translate-x-0 lg:w-0'}
      `}>
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar — toggle button always visible */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-10 print:hidden">
          <button
            onClick={() => setOpen(o => !o)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <Menu size={18} />
          </button>
          <span className="font-semibold text-gray-900 text-sm lg:hidden">Orion Diamonds Records</span>
        </div>

        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
