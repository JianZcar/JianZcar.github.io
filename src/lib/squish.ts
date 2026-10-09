const SQUASH = "scale(1.12, 0.75)";
const STRETCH = "scale(0.9, 1.12)";

interface Pressed {
  squash: Animation;
  jiggle: Animation | null;
  jiggleTimer: number | null;
}

interface PointerPress {
  el: HTMLElement;
  rect: DOMRect;
}

const pressed = new Map<HTMLElement, Pressed>();
const pointerTargets = new Map<number, PointerPress>();
const wobbles = new Map<HTMLElement, Animation>();
const keyboardTargets = new Set<HTMLElement>();

let pendingClick: PointerPress | null = null;
let pendingClickTimer = 0;

function clearPendingClick(): void {
  pendingClick = null;
  if (pendingClickTimer !== 0) {
    window.clearTimeout(pendingClickTimer);
    pendingClickTimer = 0;
  }
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function squishTarget(event: Event): HTMLElement | null {
  const [first] = event.composedPath();
  if (!(first instanceof Element)) return null;
  return first.closest<HTMLElement>(
    "button.squish, div.squish, a.squish, span.squish",
  );
}

function computedTransform(el: HTMLElement): string {
  const { transform } = getComputedStyle(el);
  return transform && transform !== "none" ? transform : "scale(1, 1)";
}

function within(rect: DOMRect, x: number, y: number, t = 2): boolean {
  return (
    x >= rect.left - t &&
    x <= rect.right + t &&
    y >= rect.top - t &&
    y <= rect.bottom + t
  );
}

function cancelWobble(el: HTMLElement): void {
  wobbles.get(el)?.cancel();
  wobbles.delete(el);
}

function press(el: HTMLElement): void {
  if (reducedMotion.matches || pressed.has(el)) return;
  cancelWobble(el);

  const squash = el.animate(
    [{ transform: computedTransform(el) }, { transform: SQUASH }],
    {
      duration: 140,
      easing: "cubic-bezier(0.34, 1.4, 0.64, 1)",
      fill: "forwards",
    },
  );

  const entry: Pressed = { squash, jiggle: null, jiggleTimer: null };
  entry.jiggleTimer = window.setTimeout(() => {
    entry.jiggle = el.animate(
      [
        { transform: SQUASH, offset: 0 },
        { transform: "scale(1.04, 0.87)", offset: 0.5 },
        { transform: SQUASH, offset: 1 },
      ],
      { duration: 620, iterations: Infinity, easing: "ease-in-out" },
    );
  }, 240);
  pressed.set(el, entry);
}

function reset(el: HTMLElement): void {
  const entry = pressed.get(el);
  if (!entry) return;
  pressed.delete(el);
  if (entry.jiggleTimer !== null) window.clearTimeout(entry.jiggleTimer);
  entry.jiggle?.cancel();
  entry.squash.cancel();
  cancelWobble(el);
}

function release(el: HTMLElement): void {
  const entry = pressed.get(el);
  if (!entry) return;
  pressed.delete(el);
  if (entry.jiggleTimer !== null) window.clearTimeout(entry.jiggleTimer);
  entry.jiggle?.cancel();

  const from = computedTransform(el);
  entry.squash.cancel();

  if (reducedMotion.matches) return;

  cancelWobble(el);
  const wobble = el.animate(
    [
      { transform: from, offset: 0 },
      { transform: STRETCH, offset: 0.3 },
      { transform: "scale(1.06, 0.95)", offset: 0.56 },
      { transform: "scale(0.97, 1.03)", offset: 0.78 },
      { transform: "scale(1, 1)", offset: 1 },
    ],
    { duration: 500, easing: "ease-in-out" },
  );
  wobbles.set(el, wobble);
  wobble.finished
    .then(() => {
      if (wobbles.get(el) === wobble) wobbles.delete(el);
    })
    .catch(() => {});
}

function resetAll(): void {
  for (const el of [...pressed.keys()]) reset(el);
  pointerTargets.clear();
  keyboardTargets.clear();
  clearPendingClick();
}

let initialized = false;

export function initSquish(): void {
  if (initialized) return;
  initialized = true;

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0) return;
      clearPendingClick();
      const el = squishTarget(event);
      if (!el) return;
      pointerTargets.set(event.pointerId, {
        el,
        rect: el.getBoundingClientRect(),
      });
      press(el);
    },
    true,
  );

  document.addEventListener(
    "pointerup",
    (event) => {
      const record = pointerTargets.get(event.pointerId);
      pointerTargets.delete(event.pointerId);
      if (!record) return;
      const { el, rect } = record;
      release(el);
      clearPendingClick();
      pendingClick = { el, rect };
      pendingClickTimer = window.setTimeout(clearPendingClick, 1000);
    },
    true,
  );

  document.addEventListener(
    "click",
    (event) => {
      if (!event.isTrusted || !pendingClick) return;
      const { el, rect } = pendingClick;
      clearPendingClick();
      const [target] = event.composedPath();
      if (target instanceof Element && el.contains(target)) return;
      if (!within(rect, event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      el.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          composed: true,
          view: window,
          clientX: event.clientX,
          clientY: event.clientY,
          button: 0,
          buttons: 0,
        }),
      );
    },
    true,
  );

  document.addEventListener(
    "pointercancel",
    (event) => {
      const record = pointerTargets.get(event.pointerId);
      pointerTargets.delete(event.pointerId);
      clearPendingClick();
      if (record) reset(record.el);
    },
    true,
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      const el = squishTarget(event);
      if (!el || keyboardTargets.has(el)) return;
      keyboardTargets.add(el);
      press(el);
    },
    true,
  );

  document.addEventListener(
    "keyup",
    (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      for (const el of [...keyboardTargets]) {
        keyboardTargets.delete(el);
        release(el);
      }
    },
    true,
  );

  window.addEventListener("blur", resetAll);
}
