import { assetJsPaths, preloadHrefs } from "./preload";

type Converse = typeof import("@converse/headless").default;

const yieldToEventLoop = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));

// Warm the browser cache for the chat client's chunks while the main thread
// is idle, so each phased import below doesn't pay a network round-trip
// when the visitor actually starts a conversation. In dev there are no
// /assets/ URLs in the source, so this is a no-op.
void fetch(import.meta.url)
  .then((response) => (response.ok ? response.text() : ""))
  .then((source) => {
    const hrefs = preloadHrefs(assetJsPaths(source), document.baseURI);
    for (const href of hrefs) {
      const link = document.createElement("link");
      link.rel = "modulepreload";
      link.href = href;
      document.head.append(link);
    }
  })
  .catch(() => {});

/**
 * Loads the XMPP chat client in phases. Each dynamic import runs as its own
 * task with a yield in between, so no single task blocks the main thread for
 * long (Total Blocking Time counts 50ms of slack per task).
 */
export async function loadConverse(): Promise<Converse> {
  const evaluate = async <T,>(load: () => Promise<T>): Promise<T> => {
    const loaded = await load();
    await yieldToEventLoop();
    return loaded;
  };

  await evaluate(() => import("strophe.js"));
  await evaluate(() => import("dompurify"));
  await evaluate(() => import("sizzle"));
  await evaluate(() => import("lodash-es"));
  await evaluate(() => import("@converse/skeletor"));
  await evaluate(() => import("dayjs"));
  const { default: converse } = await evaluate(() =>
    import("@converse/headless/shared/api/public.js"),
  );
  await evaluate(() => import("./converse-plugins"));
  return converse;
}
