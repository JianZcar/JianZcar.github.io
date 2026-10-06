import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import "../sections/sec-hero";

@customElement("page-home")
export class PageHome extends LitElement {
  static override styles = css`
    @unocss-placeholder;
  `;

  protected override firstUpdated() {
    void import("../sections/sec-cert");

    const chat = () => void import("../components/chat");
    if (document.readyState === "complete") chat();
    else window.addEventListener("load", chat, { once: true });
  }

  override render() {
    return html`
      <el-chat></el-chat>
      <sec-hero></sec-hero>
      <sec-cert></sec-cert>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "page-home": PageHome;
  }
}
