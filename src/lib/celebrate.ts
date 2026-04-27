import confetti from "canvas-confetti";

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const COLORS = ["#C2410C", "#65A30D", "#F59E0B", "#FEF3E2"];

export function celebrateMission() {
  if (reduceMotion()) return;
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.7 },
    colors: COLORS,
    scalar: 0.9,
  });
}

export function celebrateLevelUp() {
  if (reduceMotion()) return;
  const end = Date.now() + 800;
  (function frame() {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: COLORS,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: COLORS,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function celebrateGoal() {
  if (reduceMotion()) return;
  confetti({
    particleCount: 100,
    spread: 100,
    origin: { y: 0.6 },
    colors: ["#F59E0B", "#65A30D", "#C2410C"],
    scalar: 1.1,
  });
}
