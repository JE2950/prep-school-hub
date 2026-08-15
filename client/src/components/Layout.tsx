import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { QuickAddModal } from "./QuickAddModal";
import { api } from "../lib/api";

const NAV = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true },
  { to: "/calendar", label: "Calendar", icon: "📅" },
  { to: "/classes", label: "Classes & Timetable", icon: "📚" },
  { to: "/pupils", label: "Pupils", icon: "🧒" },
  { to: "/planning", label: "Planning & Goals", icon: "🎯" },
  { to: "/markbook", label: "Markbook & CE", icon: "📊" },
  { to: "/cover-work", label: "Cover Work", icon: "🗒️" },
  { to: "/pastoral", label: "Duties & Pastoral", icon: "🧑‍🤝‍🧑" },
  { to: "/co-curricular", label: "Co-curricular", icon: "🏆" },
  { to: "/cpd", label: "CPD & Career", icon: "🎓" },
  { to: "/contacts", label: "Contacts", icon: "📇" },
  { to: "/procedures", label: "Emergency Procedures", icon: "🚨" },
];

export function Layout() {
  const { teacherName, schoolName, logout } = useAuth();
  const navigate = useNavigate();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [query, setQuery] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="min-h-screen flex bg-ink-50">
      <aside className="no-print hidden md:flex w-60 shrink-0 flex-col border-r border-ink-200 bg-white">
        <div className="px-4 py-4 border-b-2 border-brand-600">
          <p className="font-serif text-lg font-semibold text-brand-800 leading-tight truncate">
            {schoolName || "Prep School Hub"}
          </p>
          <p className="text-xs text-ink-400 truncate">{teacherName || "Teacher"}</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 mx-2 my-0.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-brand-50 text-brand-800 font-medium" : "text-ink-600 hover:bg-ink-50"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-ink-100 space-y-1">
          <NavLink
            to="/settings"
            className="block rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50"
          >
            ⚙️ Settings
          </NavLink>
          <button
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-ink-50"
            onClick={logout}
          >
            ↪ Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="no-print sticky top-0 z-10 flex items-center gap-3 border-b border-ink-200 bg-white/90 backdrop-blur px-4 py-2.5">
          <form onSubmit={submitSearch} className="flex-1 max-w-md">
            <input
              className="input"
              placeholder="Search notes, reflections, pastoral logs…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          <button className="btn-primary ml-auto" onClick={() => setQuickAddOpen(true)}>
            + Quick add
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {quickAddOpen && <QuickAddModal onClose={() => setQuickAddOpen(false)} />}
    </div>
  );
}
