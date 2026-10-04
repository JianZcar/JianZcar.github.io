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
@customElement("sec-hero")
export class SecHero extends LitElement {
  static override styles = css`
    @unocss-placeholder;
  `;

  override render() {
    return html`
      <section class="pt-8 max-w-256 mx-auto">
        <div class="grid sm:grid-cols-2 grid-row-2 sm:gap-8">
          <div class="relative flex flex-col justify-center">
            <div
              class="max-w-96 after:max-w-96 sm:max-w-192 after:sm:max-w-192 after:content-[''] bg-[radial-gradient(circle,white_0%,white_5%,#c6e0ff_70%,#c6e0ff_100%)] after:absolute after:inset-0 after:bg-[radial-gradient(circle,transparent_0%,transparent_5%,#c6e0ff_70%,#c6e0ff_100%)]"
            >
              <img src="/img/my-pic.png" alt="my-pic" class="opacity-60" />
            </div>
            <div
              class=" absolute px-16 flex flex-col gap-2 font-syncopate text-3xl md:text-5xl mix-blend-multiply"
            >
              <h1 class="text-#2978A0">BUILD</h1>
              <h1 class="text-#9AD5CA">AUTOMATE</h1>
              <h1 class="text-#253031">DEPLOY</h1>
              <h3 class="text-#253031 text-lg md:text-2xl">
                <strong class="text-#4fa3ab">YOUR</strong>
                <el-scrolling-word class="italic"></el-scrolling-word>
              </h3>
            </div>
          </div>
          <div class="px-16 flex flex-col justify-center">
            <div class="relative flex flex-col justify-center items-center">
              <span class="text-xs md:text-sm line-height-loose"
                >I'm <strong>JianZcar</strong>, a Systems Software &
                Infrastructure Engineer. I help projects and businesses turn
                complex technical problems into minimal, straightforward
                solutions. Together, we build, automate, and deploy your
                <strong>vision</strong></span
              >
              <div class="md:text-lg absolute top-full mt-12 flex flex-col">
                <div class="flex justify-center items-center text-#4fa3ab py-3">
                  ${CONVERSATION}
                </div>
                <span class="italic">Let's connect.</span>
                <span>Chat with me.</span>
              </div>
            </div>
          </div>
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
