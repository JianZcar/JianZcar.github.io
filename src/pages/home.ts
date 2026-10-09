import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import "../sections/sec-hero";
import "../sections/sec-project";
type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
};

/** Runs after the current task, before the browser complains with `timeout`. */
const defer = (task: () => void) => {
  const idle = (window as IdleWindow).requestIdleCallback;
  if (idle) idle(task, { timeout: 2000 });
  else window.setTimeout(task, 0);
};

@customElement("page-home")
export class PageHome extends LitElement {
  static override styles = css`
    @unocss-placeholder;
  `;

  protected override firstUpdated() {
    this._mountCertOnApproach();
    this._mountChat();
  }

  /**
   * The strip sits below the hero, so its chunk waits for the section to enter
   * the viewport. Startup then paints the hero from the entry bundle alone: no
   * second render pass, no card images racing first paint. The default root
   * margin (no shrink) matters here — with a shrunk root the section stays
   * unloaded while the document is still exactly one screen tall, so nothing
   * can ever scroll and the observer would never fire again.
   *
   * The import runs straight from the observer instead of through `defer`:
   * queueing it for idle lets the cards render at some unpredictable moment up
   * to two seconds in, and a task that late queues in front of the hero image's
   * paint and drags LCP out with it.
   */
  private _mountCertOnApproach() {
    const host = this.renderRoot.querySelector("sec-cert");
    if (!host) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      observer.disconnect();
      void import("../sections/sec-cert");
    });

    observer.observe(host);
  }

  /**
   * The launcher is a floating button, so the chunk waits for idle rather than
   * first paint. It is queued instead of gated on visitor intent: the button
   * has to be on screen as soon as the page settles, and an idle import still
   * keeps the chunk out of the hero's critical path.
   */
  private _mountChat() {
    defer(() => void import("../components/chat"));
  }

  override render() {
    return html`
      <el-chat></el-chat>
      <sec-hero></sec-hero>
      <sec-cert></sec-cert>
      <sec-project></sec-project>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "page-home": PageHome;
  }
}
