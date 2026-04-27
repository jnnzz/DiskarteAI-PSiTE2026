import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, back, right, className }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className={cn("sticky top-0 z-30 -mx-4 mb-4 bg-background/90 px-4 pb-3 pt-6 backdrop-blur", className)}>
      <div className="flex items-start gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Bumalik"
            className="-ml-2 flex size-10 items-center justify-center rounded-xl text-foreground hover:bg-secondary"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
