import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Plus, LogOut, Brain, GraduationCap } from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";

const creatorNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/cases/new", icon: Plus, label: "Kasus Baru" },
];

const expertNav = [
  { to: "/expert", icon: GraduationCap, label: "Penilaian Saya" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const navItems = user?.role === "expert" ? expertNav : creatorNav;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar-bg text-sidebar-text border-r border-slate-700/30 flex flex-col shadow-modal z-40">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-slate-700/30">
        <Link
          to={user?.role === "expert" ? "/expert" : "/dashboard"}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <Brain size={20} className="text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-base leading-tight">Think Decision</p>
            <p className="text-sidebar-muted text-xs font-medium">MCDM Platform</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover"
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="px-3 pb-4 border-t border-slate-700/30 pt-4 space-y-2">
        {/* User Info Card */}
        <div className="bg-sidebar-hover/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-text truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-sidebar-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all duration-150"
        >
          <LogOut size={16} className="flex-shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
