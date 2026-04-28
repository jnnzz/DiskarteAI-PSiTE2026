import { NavLink } from "react-router-dom";
import { Home, MessageCircle, BookOpen, Target, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/coach", label: "Coach", icon: MessageCircle },
  { to: "/story", label: "Story", icon: BookOpen },
  { to: "/missions", label: "Missions", icon: Target },
  { to: "/insights", label: "Insights", icon: BarChart3 },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-lift backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
      <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("size-6", isActive && "stroke-[2.5]")} />
                <span className="text-[11px] font-bold">{label}</span>
                {isActive && <span className="-mt-0.5 size-1 rounded-full bg-highlight" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
