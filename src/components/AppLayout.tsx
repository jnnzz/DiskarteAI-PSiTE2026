import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { SideRail } from "./SideRail";
import { motion, AnimatePresence } from "framer-motion";

export function AppLayout() {
  const location = useLocation();
  return (
    <div className="min-h-dvh bg-background">
      <div className="flex min-h-dvh w-full">
        <SideRail />
        {/* Content column: phone width on mobile, wider on lg+ */}
        <div className="flex-1 pb-24 lg:pb-8 w-full">
          <div className="mx-auto w-full max-w-screen-xl h-full">
            <AnimatePresence mode="wait">
              <motion.main
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <Outlet />
              </motion.main>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
