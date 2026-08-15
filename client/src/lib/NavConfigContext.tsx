import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";
import { DEFAULT_NAV_ORDER } from "./navItems";

interface NavConfigValue {
  order: string[];
  hidden: string[];
  loading: boolean;
  moveUp: (to: string) => void;
  moveDown: (to: string) => void;
  hide: (to: string) => void;
  show: (to: string) => void;
}

const NavConfigContext = createContext<NavConfigValue | null>(null);

export function NavConfigProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<string[]>(DEFAULT_NAV_ORDER);
  const [hidden, setHidden] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ order: string[] | null; hidden: string[] }>("/settings/nav-config")
      .then((cfg) => {
        const saved = cfg.order && cfg.order.length ? cfg.order : DEFAULT_NAV_ORDER;
        // Keep only items that still exist, then append any new items added
        // since the user last saved (e.g. after an app update) at the end.
        const merged = [
          ...saved.filter((k) => DEFAULT_NAV_ORDER.includes(k)),
          ...DEFAULT_NAV_ORDER.filter((k) => !saved.includes(k)),
        ];
        setOrder(merged);
        setHidden(cfg.hidden ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function persist(nextOrder: string[], nextHidden: string[]) {
    setOrder(nextOrder);
    setHidden(nextHidden);
    api.put("/settings/nav-config", { order: nextOrder, hidden: nextHidden }).catch(() => {});
  }

  function moveUp(to: string) {
    const idx = order.indexOf(to);
    if (idx <= 0) return;
    const next = [...order];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    persist(next, hidden);
  }

  function moveDown(to: string) {
    const idx = order.indexOf(to);
    if (idx === -1 || idx >= order.length - 1) return;
    const next = [...order];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    persist(next, hidden);
  }

  function hide(to: string) {
    if (hidden.includes(to)) return;
    persist(order, [...hidden, to]);
  }

  function show(to: string) {
    persist(order, hidden.filter((k) => k !== to));
  }

  return (
    <NavConfigContext.Provider value={{ order, hidden, loading, moveUp, moveDown, hide, show }}>
      {children}
    </NavConfigContext.Provider>
  );
}

export function useNavConfig() {
  const ctx = useContext(NavConfigContext);
  if (!ctx) throw new Error("useNavConfig must be used within NavConfigProvider");
  return ctx;
}
