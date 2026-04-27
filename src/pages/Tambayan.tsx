import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, type TambayanPost } from "@/lib/storage";
import { PageHeader } from "@/components/PageHeader";
import { AvatarArt } from "@/components/AvatarArt";
import { Button } from "@/components/ui/button";
import { Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Tambayan() {
  const [posts, setPosts] = useLocalStorage<TambayanPost[]>(KEYS.tambayan, []);

  function toggleHeart(id: string) {
    setPosts((all) =>
      all.map((p) =>
        p.id === id
          ? { ...p, hearted: !p.hearted, hearts: p.hearts + (p.hearted ? -1 : 1) }
          : p,
      ),
    );
  }

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader
        title="Tambayan"
        subtitle="Komunidad ng mga kapamilya."
        right={
          <Button
            size="icon"
            variant="default"
            onClick={() => toast.info("Coming soon, kaibigan!", { description: "Posting feature is on the way." })}
            aria-label="Bagong post"
          >
            <Plus />
          </Button>
        }
      />

      <ul className="grid gap-3 lg:grid-cols-2">
        {posts.map((p) => (
          <li key={p.id} className="rounded-2xl bg-card p-4 shadow-card">
            <div className="flex items-start gap-3">
              <AvatarArt level={p.authorAvatar} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-bold">{p.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(p.timestamp)}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {p.content}
                </p>
                <button
                  onClick={() => toggleHeart(p.id)}
                  className={cn(
                    "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition",
                    p.hearted ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                  )}
                >
                  <Heart className={cn("size-3.5", p.hearted && "fill-current")} />
                  {p.hearts}
                </button>
              </div>
            </div>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-soft">
            Wala pang posts. Tahimik na komunidad muna.
          </li>
        )}
      </ul>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400_000);
  if (d === 0) return "ngayon";
  if (d === 1) return "kahapon";
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-PH");
}
