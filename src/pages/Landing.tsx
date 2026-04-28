import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { seedDemo, seedFresh } from "@/lib/seedDemo";
import { Home, MessageCircle, BookOpen, Target, BarChart3 } from "lucide-react";
import diskarteaiLogo from "@/assets/diskarteai-logo.png";
import heroBayanihan from "@/assets/hero-bayanihan.jpg";

const TABS = [
  { icon: Home, label: "Home", desc: "Budget & logging" },
  { icon: MessageCircle, label: "AI Coach", desc: "Ask before spending" },
  { icon: BookOpen, label: "Story", desc: "Your journey" },
  { icon: Target, label: "Missions", desc: "Goals & quests" },
  { icon: BarChart3, label: "Insights", desc: "Simple analytics" },
];

export default function Landing() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"welcome" | "onboard">("welcome");
  const [name, setName] = useState("");
  const [weeklyBudget, setWeeklyBudget] = useState("");

  function handleDemo() {
    seedDemo();
    navigate("/home");
  }

  function handleStart() {
    setStep("onboard");
  }

  function handleOnboard() {
    const budget = Number(weeklyBudget) || 2000;
    seedFresh(name || "Kaibigan", budget);
    navigate("/home");
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <header className="flex w-full items-center gap-3 px-6 py-6 md:px-12 lg:px-24">
        <img src={diskarteaiLogo} alt="DiskarteAI Logo" className="size-12 rounded-2xl object-contain shadow-sm" />
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Diskarte<span className="text-primary">AI</span>
          </h1>
          <p className="text-[11px] md:text-xs font-semibold text-muted-foreground">Pera mo, diskarte mo.</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center w-full px-6 md:px-12 lg:px-24 pb-12 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 w-full max-w-7xl items-center">
          
          {/* Left Side: Content */}
          <div className="flex flex-col space-y-8 w-full max-w-xl mx-auto lg:mx-0">
            {step === "welcome" ? (
              <>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
                    Your <span className="text-primary">financial coach</span> in one app.
                  </h2>
                  <p className="text-lg text-foreground/80 leading-relaxed">
                    Hindi tracker, hindi calculator — coach. Mag-isip bago gumastos, mag-ipon nang may kwento, at lumevel-up sa pera.
                  </p>
                </div>

                {/* Mobile Image (Visible only on small screens) */}
                <div className="lg:hidden w-full overflow-hidden rounded-3xl border border-border/50 shadow-soft">
                  <img src={heroBayanihan} alt="Kabuhayan at Bayanihan" className="aspect-video w-full object-cover" />
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleStart} size="xl" variant="default" className="w-full sm:w-auto px-8 animate-pulse-ring">
                      Mag-umpisa ngayon
                    </Button>
                    <Button onClick={handleDemo} size="xl" variant="outline" className="w-full sm:w-auto px-8">
                      Try Demo Account
                    </Button>
                  </div>
                  {/* <p className="text-sm text-muted-foreground pt-2">
                    Walang sign-up. Walang password. Lahat sa device mo.
                  </p> */}
                </div>

                {/* Feature chips */}
                <div className="pt-8 border-t border-border/50">
                  {/* <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    5 Tabs. Walang Clutter.
                  </p> */}
                  <div className="grid grid-cols-5 gap-2">
                    {TABS.map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 shadow-soft transition hover:-translate-y-1">
                        <Icon className="size-5 text-primary" />
                        <span className="text-[10px] sm:text-xs font-semibold text-foreground text-center leading-tight">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Onboarding */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-3xl font-extrabold">Tara, magsimula! 🌱</h2>
                  <p className="mt-2 text-base text-muted-foreground">
                    Kailangan lang ng dalawang bagay para mag-umpisa.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Pangalan mo</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Maria"
                      className="h-12 text-lg"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Weekly budget (₱)</Label>
                    <p className="text-xs text-muted-foreground">Magkano ang gusto mong gastusin per week?</p>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={weeklyBudget}
                      onChange={e => setWeeklyBudget(e.target.value)}
                      placeholder="e.g. 3500"
                      className="h-12 text-lg font-bold"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-secondary/50 p-5 border border-border/50">
                  <p className="font-bold text-foreground flex items-center gap-2">💡 Hindi ka sigurado?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Okay lang! Pwede mong baguhin anytime. Kahit estimate lang muna.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button onClick={handleOnboard} size="xl" variant="default" className="flex-1">
                    Simulan ang journey! 🚀
                  </Button>
                  <Button onClick={() => setStep("welcome")} size="xl" variant="outline" className="w-full sm:w-auto px-6">
                    ← Bumalik
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Desktop Image */}
          <div className="hidden lg:block w-full">
             <div className="relative w-full aspect-square max-w-2xl mx-auto xl:ml-auto">
               <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-[3rem] -rotate-3 scale-105 transition-transform duration-700 ease-out"></div>
               <div className="relative h-full w-full overflow-hidden rounded-[3rem] border-8 border-background shadow-2xl">
                 <img src={heroBayanihan} alt="Kabuhayan at Bayanihan" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
               </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}
