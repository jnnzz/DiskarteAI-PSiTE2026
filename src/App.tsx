import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Ipon from "./pages/Ipon";
import Gastos from "./pages/Gastos";
import Missions from "./pages/Missions";
import Palakasan from "./pages/Palakasan";
import Tambayan from "./pages/Tambayan";
import Gabay from "./pages/Gabay";
import Kwento from "./pages/Kwento";
import ProfilePage from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<AppLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/ipon" element={<Ipon />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/palakasan" element={<Palakasan />} />
            <Route path="/tambayan" element={<Tambayan />} />
            <Route path="/gabay" element={<Gabay />} />
            <Route path="/kwento" element={<Kwento />} />
            <Route path="/kwento/:storyId" element={<Kwento />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/index" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
