import { cn } from "@/lib/utils";
import avatarUser from "@/assets/avatar-user.png";
import type { AvatarLevel } from "@/lib/storage";

const SRCS: Record<number, string> = {
  1: avatarUser,
  3: avatarUser,
  5: avatarUser,
  10: avatarUser,
};

interface AvatarArtProps {
  level: AvatarLevel | number;
  size?: number;
  ring?: boolean;
  className?: string;
  alt?: string;
}

function pickVariant(level: number): AvatarLevel {
  if (level >= 10) return 10;
  if (level >= 5) return 5;
  if (level >= 3) return 3;
  return 1;
}

export function AvatarArt({ level, size = 96, ring, className, alt = "Avatar" }: AvatarArtProps) {
  const variant = pickVariant(level);
  const src = SRCS[variant];
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-secondary",
        ring && "ring-4 ring-highlight ring-offset-2 ring-offset-background",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}
