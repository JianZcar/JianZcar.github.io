import type { Plugin } from "vite";

/** The chunk that boots the XMPP client, and where its long init phases live. */
const CONVERSE_INIT_MODULE =
  "@converse/headless/shared/api/public.js";

/** Phase-end anchors inside the boot module. A `await` yield goes after each. */
const INIT_PHASES = [
  "await initClientConfig(_converse);",
  "initPlugins(_converse);",
];

/**
 * converse.initialize() runs its storage/session/plugin/login phases as one
 * long microtask chain, which Lighthouse counts as a single long task. Insert
 * event-loop yields between the phases so each runs in its own task (each task
 * gets its own 50ms Total Blocking Time allowance).
 */
export function converseTaskYields(): Plugin {
  return {
    name: "converse-init-task-yields",
    transform(code: string, id: string) {
      const normalized = id.replace(/\\/g, "/");
      if (!normalized.endsWith(CONVERSE_INIT_MODULE)) return;

      let out = code;
      for (const phase of INIT_PHASES) {
        const yieldAfter = `${phase}\n        await new Promise((r) => setTimeout(r, 0));`;
        out = out.replace(phase, yieldAfter);
      }

      return out === code ? undefined : out;
    },
  };
}