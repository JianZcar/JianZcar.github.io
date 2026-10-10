import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

import "../components/scrolling-word";

const CONVERSATION = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="2em"
    height="2em"
    viewBox="0 0 12 12"
  >
    <path d="M0 0h12v12H0z" fill="none" />
    <path
      fill="none"
      stroke="currentColor"
      d="M6 .5H2C1.2.5.5 1.2.5 2c0 .6.4 1.2 1 1.4v1.9c0 .4.5.7.9.3l2.1-2.1H6c.8 0 1.5-.7 1.5-1.5S6.8.5 6 .5zm0 5h4c.8 0 1.5.7 1.5 1.5c0 .6-.4 1.2-1 1.4v1.9c0 .4-.5.7-.9.4L7.5 8.5H6c-.8 0-1.5-.7-1.5-1.5S5.2 5.5 6 5.5z"
    />
  </svg>
`;

const CHEVRON = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
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
    <path d="m6 9 6 6 6-6" />
  </svg>
`;
@customElement("sec-hero")
export class SecHero extends LitElement {
  static override styles = css`
    @unocss-placeholder #scroll-hint {
      transition: opacity 500ms ease-out;
    }

    #scroll-hint.is-hidden {
      opacity: 0;
      pointer-events: none;
    }

    #scroll-hint svg {
      animation: hint-bob 2.6s ease-in-out infinite;
    }

    @keyframes hint-bob {
      50% {
        transform: translateY(4px);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #scroll-hint,
      #scroll-hint svg {
        transition: none;
        animation: none;
      }
    }
  `;

  private _onFirstScroll = () => {
    if (window.scrollY === 0) return;
    window.removeEventListener("scroll", this._onFirstScroll);
    const hint = this.renderRoot.querySelector("#scroll-hint");
    if (!hint) return;
    hint.classList.add("is-hidden");
    hint.setAttribute("aria-hidden", "true");
  };

  protected override firstUpdated() {
    const hint = this.renderRoot.querySelector("#scroll-hint");
    if (!hint) return;

    if (window.scrollY > 0) {
      hint.classList.add("is-hidden");
      hint.setAttribute("aria-hidden", "true");
      return;
    }
    window.addEventListener("scroll", this._onFirstScroll, { passive: true });
  }

  override disconnectedCallback() {
    window.removeEventListener("scroll", this._onFirstScroll);
    super.disconnectedCallback();
  }

  override render() {
    return html`
      <section class="relative h-screen max-w-256 mx-auto">
        <div
          class="pt-6 sm:pt-12 md:pt-24 grid md:grid-cols-2 grid-row-2 md:gap-8"
        >
          <div class="relative flex flex-col justify-center">
            <div
              class="max-w-96 after:max-w-96 md:max-w-192 after:md:max-w-192 after:content-[''] bg-[radial-gradient(circle,white_0%,white_5%,#c6e0ff_70%,#c6e0ff_100%)] after:absolute after:inset-0 after:bg-[radial-gradient(circle,transparent_0%,transparent_5%,#c6e0ff_70%,#c6e0ff_100%)]"
            >
              <img
                src="/img/my-pic-768.webp"
                srcset="
                  /img/my-pic-384.webp   384w,
                  /img/my-pic-768.webp   768w,
                  /img/my-pic-1024.webp 1024w
                "
                sizes="(min-width: 1280px) 496px, (min-width: 640px) 45vw, 100vw"
                width="768"
                height="768"
                alt=""
                fetchpriority="high"
                decoding="async"
                class="block h-auto w-full opacity-60"
              />
            </div>
            <div
              class=" absolute px-12 flex flex-col gap-2 font-syncopate text-3xl sm:text-5xl mix-blend-multiply"
            >
              <h1 class="text-#2978A0">BUILD</h1>
              <h1 class="text-#9AD5CA">AUTOMATE</h1>
              <h1 class="text-#253031">DEPLOY</h1>
              <h2 class="text-#253031 text-lg sm:text-2xl">
                <strong class="text-#4fa3ab">YOUR</strong>
                <el-scrolling-word class="italic"></el-scrolling-word>
              </h2>
            </div>
          </div>
          <div class="px-12 flex flex-col justify-center">
            <div class="relative flex flex-col justify-center items-center">
              <span class="text-xs sm:text-sm line-height-loose"
                >I'm <strong>JianZcar</strong> a developer based in the
                Philippines who builds software and the systems that bring it
                into production. My work connects application development,
                delivery automation, and Linux infrastructure, with open-source
                projects that put these skills into practice.</span
              >
              <div class="md:absolute top-full mt-8 flex flex-col sm:text-lg ">
                <div class="flex justify-center items-center text-#4fa3ab py-3">
                  ${CONVERSATION}
                </div>
                <span class="italic">Let's connect.</span>
                <span>Chat with me.</span>
              </div>
            </div>
          </div>
        </div>
        <div
          id="scroll-hint"
          class="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 text-xs text-[#3f6165] select-none"
        >
          <span>Scroll to explore</span>
          ${CHEVRON}
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "sec-hero": SecHero;
  }
}
