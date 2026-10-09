/**
 * A live stat fetched at runtime. Every project picks its own stats, so a repo
 * with no container images simply omits the "pulls" entry.
 */
export type ProjectStat =
  | { kind: "stars"; repo?: string; value?: number }
  | { kind: "pulls"; packages?: string[]; value?: number }
  | {
      kind: "downloads";
      sources?: Array<{
        kind: "github" | "sourceforge";
        repoOrProject: string;
      }>;
      value?: number;
    };

export type Project = {
  name: string;
  image: string;
  description: string;
  stats: ProjectStat[];
  languages: string[];
};

export const PROJECTS: Project[] = [
  {
    name: "Zena Linux",
    image: "/img/zena",
    description:
      "A bootc-based, immutable Linux desktop focused on performance and modern Wayland workflows. Ships with the Cachy kernel, Niri, MangoWC, and Dank Material Shell.",
    stats: [
      { kind: "stars", value: 147 },
      {
        kind: "pulls",
        value: 5078 + 2929,
      },
    ],
    languages: ["Bash", "Python"],
  },
  {
    name: "FuzPad",
    image: "/img/fuzpad",
    description:
      "a minimalistic, command-line note management tool written in bash script and powered by the fuzzy finder fzf.",
    stats: [
      { kind: "stars", value: 147 },
      {
        kind: "downloads",
        value: 684 + 225,
      },
    ],
    languages: ["Bash"],
  },
];
