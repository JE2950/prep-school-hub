export interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  pinned?: boolean; // always visible — can be reordered but not hidden
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "🏠", end: true, pinned: true },
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

export const DEFAULT_NAV_ORDER = NAV_ITEMS.map((i) => i.to);
