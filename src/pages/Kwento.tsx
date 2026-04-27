import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { KEYS, type KwentoProgress } from "@/lib/storage";
import { KWENTO_STORIES, type KwentoStory } from "@/lib/kwento";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { generateKwentoSummary } from "@/lib/ai";
import { useAwardXP } from "@/hooks/useAwardXP";
import { Sparkles } from "lucide-react";

export default function Kwento() {
  const navigate = useNavigate();
  const { storyId } = useParams<{ storyId: string }>();
  const [progress, setProgress] = useLocalStorage<KwentoProgress[]>(KEYS.kwento, []);

  if (!storyId) {
    return (
      <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
        <PageHeader title="Kwento ng Pera" subtitle="Mga interactive na istorya tungkol sa pera." back />
        <ul className="grid gap-3 lg:grid-cols-2">
          {KWENTO_STORIES.map((s) => {
            const done = progress.find((p) => p.storyId === s.id)?.completed;
            return (
              <li key={s.id}>
                <button
                  onClick={() => navigate(`/kwento/${s.id}`)}
                  className="flex w-full items-center gap-4 rounded-3xl bg-card p-5 text-left shadow-card transition-shadow hover:shadow-lift"
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-3xl">
                    {s.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                    {done && <p className="mt-1 text-[11px] font-bold text-accent">✓ Tapos na</p>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const story = KWENTO_STORIES.find((s) => s.id === storyId);
  if (!story) {
    return (
      <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
        <PageHeader title="Walang nahanap" back />
      </div>
    );
  }

  return <StoryView story={story} progress={progress} setProgress={setProgress} />;
}

function StoryView({
  story,
  progress,
  setProgress,
}: {
  story: KwentoStory;
  progress: KwentoProgress[];
  setProgress: (v: KwentoProgress[] | ((p: KwentoProgress[]) => KwentoProgress[])) => void;
}) {
  const award = useAwardXP();
  const [nodeId, setNodeId] = useState(story.startNodeId);
  const [chosen, setChosen] = useState<{ label: string; lesson?: string }[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const node = story.nodes[nodeId];

  function pick(choiceId: string, label: string, next: string, lesson?: string) {
    setChosen((c) => [...c, { label, lesson }]);
    setNodeId(next);
  }

  async function finishStory() {
    setGenerating(true);
    try {
      const text = await generateKwentoSummary(story.title, chosen);
      setSummary(text);
      setProgress((all) => {
        const filtered = all.filter((p) => p.storyId !== story.id);
        return [
          ...filtered,
          {
            storyId: story.id,
            currentNodeId: nodeId,
            choicesMade: chosen.map((c) => c.label),
            completed: true,
            aiSummary: text,
          },
        ];
      });
      award(20, "Kwento natapos!", "kwento-finisher");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="px-4 pb-6 lg:px-8 lg:pb-10 lg:pt-2">
      <PageHeader title={story.title} subtitle={story.subtitle} back />

      <div className="rounded-3xl bg-card p-6 shadow-card">
        <div className="mb-3 text-4xl">{story.emoji}</div>
        <p className="whitespace-pre-wrap leading-relaxed text-foreground">{node.text}</p>

        {node.choices && (
          <div className="mt-5 space-y-2">
            {node.choices.map((c) => (
              <Button
                key={c.id}
                onClick={() => pick(c.id, c.label, c.next, c.lesson)}
                variant="outline"
                size="lg"
                className="h-auto w-full justify-start py-3 text-left text-sm"
              >
                {c.label}
              </Button>
            ))}
          </div>
        )}

        {node.ending && !summary && (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-secondary p-3 text-sm font-semibold">{node.ending}</div>
            <Button onClick={finishStory} size="xl" variant="highlight" disabled={generating}>
              {generating ? "Iniisip ng AI ang aral..." : "Tapusin at kunin ang aral"}
            </Button>
          </div>
        )}

        {summary && (
          <div className="mt-5 rounded-2xl bg-gradient-warm p-[2px]">
            <div className="rounded-[calc(1rem-2px)] bg-card p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="size-4" />
                Aral mula sa AI
              </div>
              <p className="text-sm leading-relaxed">{summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
