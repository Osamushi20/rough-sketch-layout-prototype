export type ToneKey = "かわいい" | "きりっと" | "にぎやか" | "しずか";

export type StyleProfile = {
  tone: ToneKey;
  background: string;
  ink: string;
  secondary: string;
  accent: string;
  accentSecondary: string;
  displayFont: string;
  bodyFont: string;
  weight: number;
  radius: number;
  tracking: string;
  leading: number;
  motif: "dots" | "rule" | "confetti" | "none";
  density: "airy" | "compact";
};

const profiles: Record<ToneKey, StyleProfile> = {
  "かわいい": { tone: "かわいい", background: "#FCF2F4", ink: "#3B2A31", secondary: "#8C7078", accent: "#E0567F", accentSecondary: "#F2C8A0", displayFont: '"Hiragino Maru Gothic ProN", sans-serif', bodyFont: '"Hiragino Maru Gothic ProN", sans-serif', weight: 700, radius: 13, tracking: "0.01em", leading: 1.85, motif: "dots", density: "airy" },
  "きりっと": { tone: "きりっと", background: "#F3F4F5", ink: "#111518", secondary: "#6B7278", accent: "#1F4E8C", accentSecondary: "#B9C2CB", displayFont: '"Hiragino Sans", sans-serif', bodyFont: '"Hiragino Sans", sans-serif', weight: 800, radius: 0, tracking: "-0.015em", leading: 1.65, motif: "rule", density: "compact" },
  "にぎやか": { tone: "にぎやか", background: "#FFF7DF", ink: "#1E2019", secondary: "#6E6A52", accent: "#E4590A", accentSecondary: "#2E9E6B", displayFont: '"Hiragino Sans", sans-serif', bodyFont: '"Hiragino Sans", sans-serif', weight: 800, radius: 5, tracking: "0.005em", leading: 1.7, motif: "confetti", density: "compact" },
  "しずか": { tone: "しずか", background: "#ECEDE8", ink: "#2A2C29", secondary: "#7C827C", accent: "#5E6E62", accentSecondary: "#C8CCC4", displayFont: '"Hiragino Mincho ProN", serif', bodyFont: '"Hiragino Mincho ProN", serif', weight: 500, radius: 0, tracking: "0.06em", leading: 2.05, motif: "none", density: "airy" }
};

export function getStyleProfile(tone: ToneKey): StyleProfile {
  return { ...profiles[tone] };
}
