import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

type Props = {
  message: string;
  mood?: "good" | "okay" | "tough";
};

const moodStyles = {
  good: { bg: "bg-accent/10", border: "border-accent/20", icon: "text-accent" },
  okay: { bg: "bg-highlight/10", border: "border-highlight/20", icon: "text-highlight" },
  tough: { bg: "bg-destructive/10", border: "border-destructive/20", icon: "text-destructive" },
};

export function DailyCheckin({ message, mood = "okay" }: Props) {
  const style = moodStyles[mood];

  return (
    <div />
  );
}
