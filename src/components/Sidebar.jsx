import { NavLink, useNavigate } from 'react-router-dom'
import { ClipboardList, LogOut, Diamond } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col h-screen sticky top-0 shrink-0 overflow-y-auto">
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Diamond className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-lg">Orion Diamonds</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Records</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`
          }
        >
          <ClipboardList className="w-4 h-4" />
          Enquiries
        </NavLink>
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 mb-3">
          <p className="text-sm font-medium truncate">{user?.display_name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
