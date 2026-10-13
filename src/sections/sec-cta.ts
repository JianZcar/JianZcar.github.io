import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import "../components/cta-buttons";

@customElement("sec-cta")
export class SecCta extends LitElement {
  override render() {
    return html`
      <section class="mx-auto max-w-256 px-4 pb-32">
        <div class="flex flex-col items-center gap-6 text-center">
          <div class="space-y-2">
            <h2 class="text-2xl font-semibold text-[#253031]">
              Let's work together
            </h2>
            <p class="text-sm leading-relaxed text-[#315659]/90">
              Have a project in mind? Feel free to reach out.
            </p>
          </div>

          <el-cta-buttons></el-cta-buttons>
        </div>
      </section>
    `;
  }

  static override styles = css`
    @unocss-placeholder;
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "sec-cta": SecCta;
  }
}
