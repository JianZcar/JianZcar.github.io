import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

const GITHUB = html`
  <svg
    width="1.25em"
    height="1.25em"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24 0-.87 0-1.7-2.78.61-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.26-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.56 9.56 0 0 1 2.5-.34 9.56 9.56 0 0 1 2.5.34c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.39.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.33 0 2.4 0 2.73 0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
    />
  </svg>
`;

const MAIL = html`
  <svg
    width="1.25em"
    height="1.25em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
`;

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

          <div class="flex flex-wrap items-center justify-center gap-3">
            <a
              class="squish inline-flex min-h-11 items-center gap-2 rounded-full border border-white/75 bg-white/60 px-6 text-sm font-medium text-[#253031]/90 shadow-[0_12px_35px_rgba(37,48,49,0.1)] backdrop-blur-2xl transition-colors duration-300 ease-out hover:border-white/85 hover:bg-white/70 active:bg-white/80 focus-visible:outline-2 focus-visible:outline-[#2978a0]/50 focus-visible:outline-offset-2 motion-reduce:transition-none"
              href="https://github.com/jianzcar"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${GITHUB}
              <span>GitHub</span>
            </a>

            <a
              class="squish inline-flex min-h-11 items-center gap-2 rounded-full border border-white/75 bg-white/60 px-6 text-sm font-medium text-[#253031]/90 shadow-[0_12px_35px_rgba(37,48,49,0.1)] backdrop-blur-2xl transition-colors duration-300 ease-out hover:border-white/85 hover:bg-white/70 active:bg-white/80 focus-visible:outline-2 focus-visible:outline-[#2978a0]/50 focus-visible:outline-offset-2 motion-reduce:transition-none"
              href="mailto:jianzcar@gmail.com"
            >
              ${MAIL}
              <span>Email</span>
            </a>
          </div>
        </div>
      </section>
    `;
  }

  static override styles = css`
    :host {
      display: block;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "sec-cta": SecCta;
  }
}
