import { NavLink, useNavigate } from 'react-router-dom'
import { ClipboardList, LogOut, Diamond, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-48 min-w-[12rem] bg-gray-900 text-white flex flex-col h-screen shrink-0 overflow-y-auto print:hidden">
      <div className="px-4 py-4 border-b border-gray-800 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Diamond className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="font-bold text-sm leading-tight">Orion Diamonds</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 pl-7">Records</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white transition-colors mt-0.5"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <ClipboardList className="w-4 h-4 shrink-0" />
          Enquiries
        </NavLink>
      </nav>

      <div className="px-2 py-3 border-t border-gray-800">
        <div className="px-3 mb-2">
          <p className="text-xs font-medium truncate">{user?.display_name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
