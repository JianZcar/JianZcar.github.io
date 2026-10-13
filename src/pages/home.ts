import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import "../sections/sec-hero";
import "../sections/sec-project";
import "../sections/sec-cta";

@customElement("page-home")
export class PageHome extends LitElement {
  static override styles = css`
    @unocss-placeholder;
  `;

  protected override firstUpdated() {
    this._mountCertOnApproach();
  }

  /**
   * The strip sits below the hero, so its chunk waits for the section to enter
   * the viewport. Startup then paints the hero from the entry bundle alone: no
   * second render pass, no card images racing first paint. The default root
   * margin (no shrink) matters here — with a shrunk root the section stays
   * unloaded while the document is still exactly one screen tall, so nothing
   * can ever scroll and the observer would never fire again.
   *
   * The import runs straight from the observer instead of queueing it for idle:
   * queueing lets the cards render at some unpredictable moment up
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

  override render() {
    return html`
      <sec-hero></sec-hero>
      <sec-cert></sec-cert>
      <sec-project></sec-project>
      <sec-cta></sec-cta>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "page-home": PageHome;
  }
}
