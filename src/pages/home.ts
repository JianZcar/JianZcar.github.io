import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import "../sections/sec-hero";
import "../sections/sec-cert";
import "../components/chat";

@customElement("page-home")
export class PageHome extends LitElement {
  static override styles = css`
    @unocss-placeholder;
  `;

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
