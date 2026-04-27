import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Home,
  MessageCircle,
  PiggyBank,
  Receipt,
  Sparkles,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/ipon", label: "Ipon", icon: PiggyBank },
  { to: "/gastos", label: "Gastos", icon: Receipt },
  { to: "/missions", label: "FinQuest", icon: Trophy },
  { to: "/palakasan", label: "Palakasan", icon: Trophy },
];

const SECONDARY = [
  { to: "/gabay", label: "Gabay AI", icon: MessageCircle },
  { to: "/kwento", label: "Kwento ng Pera", icon: BookOpen },
  { to: "/tambayan", label: "Tambayan", icon: Users },
  { to: "/profile", label: "Ako", icon: User },
];

export function SideRail() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card/60 px-3 py-6 lg:flex xl:w-64">
      {/* Brand */}
      <NavLink to="/" className="mb-6 flex items-center gap-2 px-2">
        <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-warm shadow-card">
          <Sparkles className="size-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-extrabold tracking-tight">
            Kabuhayan<span className="text-primary">AI</span>
          </p>
          <p className="text-[10px] font-semibold text-muted-foreground">Pera mo, kabuhayan mo.</p>
        </div>
      </NavLink>

      <RailGroup label="Pera" items={PRIMARY} />
      <RailGroup label="Komunidad" items={SECONDARY} className="mt-4" />

      <div className="mt-auto rounded-2xl bg-gradient-warm/10 p-3 text-[11px] text-muted-foreground">
        <p className="font-bold text-foreground">Browser-first MVP</p>
        <p className="mt-1">Lahat ng data nasa device mo. Ligtas at mabilis.</p>
      </div>
    </aside>
  );
}

function RailGroup({
  label,
  items,
  className,
}: {
  label: string;
  items: typeof PRIMARY;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => (
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
    </div>
  );
}
