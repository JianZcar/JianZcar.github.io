import type { ProjectStat } from "../data/projects";

export type ResolvedStat = {
  kind: ProjectStat["kind"];
  label: string;
  value: number;
};

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 5078 -> "5.1K", 142 -> "142". */
export function formatCount(value: number): string {
  return compact.format(value);
}

export async function loadStats(
  stats: ProjectStat[],
): Promise<ResolvedStat[]> {
  return stats
    .map((stat) => {
      if (stat.kind === "stars") {
        const value = stat.value ?? 0;
        return { kind: "stars", label: "Stars", value } as ResolvedStat;
      }
      if (stat.kind === "pulls") {
        const value = stat.value ?? 0;
        return { kind: "pulls", label: "Image pulls", value } as ResolvedStat;
      }
      const value = stat.value ?? 0;
      return { kind: "downloads", label: "Downloads", value } as ResolvedStat;
    })
    .filter((stat) => stat.value > 0 || true);
}
