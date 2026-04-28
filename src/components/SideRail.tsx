import { NavLink } from "react-router-dom";
import { Home, MessageCircle, BookOpen, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import diskarteaiLogo from "@/assets/diskarteai-logo.png";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/coach", label: "AI Coach", icon: MessageCircle },
  { to: "/story", label: "Story", icon: BookOpen },
  { to: "/missions", label: "Missions", icon: Target },
  { to: "/insights", label: "Insights", icon: BarChart3 },
];

export function SideRail() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card/60 px-3 py-6 lg:flex xl:w-64">
      {/* Brand */}
      <NavLink to="/" className="mb-6 flex items-center gap-3 px-2">
        <img src={diskarteaiLogo} alt="DiskarteAI Logo" className="size-9 rounded-2xl object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight">
            Diskarte<span className="text-primary">AI</span>
          </p>
          <p className="text-[10px] font-semibold text-muted-foreground">Pera mo, diskarte mo.</p>
        </div>
      </NavLink>

      <ul className="space-y-0.5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mt-auto rounded-2xl bg-gradient-warm/10 p-3 text-[11px] text-muted-foreground">
        <p className="font-bold text-foreground">Financial Coach</p>
        <p className="mt-1">Lahat ng data nasa device mo. Ligtas at mabilis.</p>
      </div>
    </aside>
  );
}
