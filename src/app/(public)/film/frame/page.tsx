import type { Orientation } from "@/components/film/scenes";
import { FrameClient } from "./FrameClient";

export const metadata = { title: "Film frame", robots: { index: false } };

/** Bare frame surface for the export pipeline (no site chrome). */
export default async function FramePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawT = typeof sp.t === "string" ? Number.parseFloat(sp.t) : 0;
  const t = Number.isFinite(rawT) ? rawT : 0;
  const cap = sp.cap === "1";
  const orientation: Orientation = sp.ar === "916" ? "9:16" : "16:9";
  return <FrameClient initialT={t} initialCap={cap} orientation={orientation} />;
}
