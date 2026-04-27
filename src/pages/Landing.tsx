import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { seedDemo, seedFresh } from "@/lib/seedDemo";
import { Sparkles, BookOpen, MessageCircle, Trophy, Receipt, PiggyBank, Users } from "lucide-react";
import heroImg from "@/assets/hero-bayanihan.jpg";

const MODULE_CHIPS = [
  { icon: PiggyBank, label: "Ipon" },
  { icon: Receipt, label: "Gastos" },
  { icon: Trophy, label: "Quests" },
  { icon: MessageCircle, label: "Gabay AI" },
  { icon: BookOpen, label: "Kwento" },
  { icon: Users, label: "Tambayan" },
];

export default function Landing() {
  const navigate = useNavigate();

  function handleDemo() {
    seedDemo();
    navigate("/home");
  }
  function handleFresh() {
    seedFresh();
    navigate("/home");
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-8 pt-10 lg:px-10">
        {/* Logo + tagline */}
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-warm shadow-card">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Kabuhayan<span className="text-primary">AI</span>
            </h1>
            <p className="text-[11px] font-semibold text-muted-foreground">Pera mo, kabuhayan mo.</p>
          </div>
        </div>

        {/* Hero: stacks on mobile, two-column on lg */}
        <div className="mt-8 grid items-center gap-8 lg:mt-16 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 lg:order-1">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight lg:text-5xl">
              Ang <span className="text-primary">kapamilya</span> mo sa pera.
            </h2>
            <p className="mt-3 text-base text-foreground/80 lg:text-lg">
              Mag-ipon, mag-track ng gastos, at matuto sa AI coach na nakakaintindi ng Tagalog at Cebuano. Para sa Filipino hustle.
            </p>

            <div className="mt-6 space-y-3 lg:max-w-sm">
              <Button onClick={handleDemo} size="xl" variant="default" className="animate-pulse-ring">
                Try Demo Account
              </Button>
              <Button onClick={handleFresh} size="xl" variant="outline">
                Mag-umpisa nang bago
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Walang sign-up. Walang password. Lahat sa device mo.
              </p>
            </div>
          </div>

          <div className="relative order-1 overflow-hidden rounded-3xl shadow-card lg:order-2">
            <img
              src={heroImg}
              alt="Bayanihan scene: sari-sari store, jeepney at sunset"
              width={1280}
              height={896}
              className="h-56 w-full object-cover lg:h-[480px]"
            />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card/80 to-transparent" />
          </div>
        </div>

        {/* Module chips */}
        <div className="mt-auto pt-12 lg:pt-16">
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Built for the Filipino Hustle
          </p>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-6 lg:gap-4">
            {MODULE_CHIPS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 rounded-2xl bg-card p-3 shadow-soft lg:p-4"
              >
                <Icon className="size-5 text-primary lg:size-6" />
                <span className="text-[11px] font-semibold text-foreground lg:text-xs">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
