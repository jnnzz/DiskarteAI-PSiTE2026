import { cn } from "@/lib/utils";
import { formatPeso } from "@/lib/storage";

interface PesoProps {
  amount: number;
  className?: string;
  withDecimals?: boolean;
  sign?: "neutral" | "minus" | "plus";
}

export function Peso({ amount, className, withDecimals, sign = "neutral" }: PesoProps) {
  const prefix = sign === "minus" ? "-" : sign === "plus" ? "+" : "";
  return (
    <span className={cn("tabular font-extrabold", className)}>
      {prefix}
      {formatPeso(amount, withDecimals)}
    </span>
  );
}
