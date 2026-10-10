import { css, html, LitElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";

import { PROJECTS, type Project } from "../data/projects";
import {
  formatCount,
  loadStats,
  type ResolvedStat,
} from "../lib/project-stats";

const STAR = html`
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8L12 2Z"
    />
  </svg>
`;

const PULL = html`
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
`;

const STAT_ICON: Record<ResolvedStat["kind"], unknown> = {
  stars: STAR,
  pulls: PULL,
  downloads: PULL,
};

const GITHUB = html`
  <svg
    width="2em"
    height="2em"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24 0-.87 0-1.7-2.78.61-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.26-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.56 9.56 0 0 1 2.5-.34 9.56 9.56 0 0 1 2.5.34c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.39.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.33 0 2.4 0 2.73 0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
    />
  </svg>
`;

@customElement("sec-project")
export class SecProject extends LitElement {
  private _projects: Project[] = [...PROJECTS];
  private _stats = new Map<string, ResolvedStat[]>();

  get projects() {
    return this._projects;
  }

  set projects(value: Project[]) {
    if (this._projects === value) return;
    this._projects = value;
    this.requestUpdate();
  }

  protected override firstUpdated() {
    void this._loadStats();
  }

  private async _loadStats() {
    const loaded = await Promise.all(
      this._projects.map(
        async (project) =>
          [project.name, await loadStats(project.stats)] as const,
      ),
    );

    this._stats = new Map(loaded);
    this.requestUpdate();
  }

  private _renderStat(stat: ResolvedStat) {
    return html`
      <span
        class="squish inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/50 px-2.5 py-1 text-[11px] font-medium text-[#315659] shadow-[0_8px_24px_rgba(37,48,49,0.08)]"
        title="${stat.label}"
      >
        ${STAT_ICON[stat.kind]}
        <span>${formatCount(stat.value)}</span>
      </span>
    `;
  }

  private _renderProject(project: Project) {
    return html`
      <article
        class="group overflow-hidden flex flex-col rounded-3xl border border-white/75 bg-white/40 shadow-[0_20px_60px_rgba(37,48,49,0.14)]"
      >
        <div class="relative h-48 overflow-hidden">
          <img
            src="${project.image}-960.webp"
            srcset="
              ${project.image}-480.webp 480w,
              ${project.image}-960.webp 960w
            "
            sizes="(min-width: 768px) 40rem, 100vw"
            width="960"
            height="540"
            alt=${project.name}
            loading="lazy"
            decoding="async"
            class="block h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none [mask-image:linear-gradient(to_top,transparent_0%,black_100%)] [mask-size:100%_100%] [mask-repeat:no-repeat] [mask-type:alpha]"
          />
          <div
            class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#c6e0ff]"
          ></div>
        </div>

        <div class="flex-1 flex flex-col p-6 pt-0">
          <h3 class="m-0 text-lg font-semibold text-[#253031]">
            ${project.name}
          </h3>
          <p class="mt-2 mb-auto text-sm leading-relaxed text-[#315659]/90">
            ${project.description}
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            ${(this._stats.get(project.name) ?? []).map((stat) =>
              this._renderStat(stat),
            )}
          </div>

          <div class="mt-4 w-full flex justify-between">
            ${
              project.technologies.length > 0
                ? html`
                    <div class="flex flex-wrap items-center gap-2">
                      ${project.technologies.map(
                        (technology) => html`
                          <span
                            class="squish inline-flex items-center rounded-full border border-white/70 bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-[#2978A0]"
                            >${technology}</span
                          >
                        `,
                      )}
                    </div>
                  `
                : nothing
            }
            <a
              class="squish inline-flex items-center gap-1.5 h-9 shrink-0 rounded-full border border-white/70 bg-white/50 px-3 text-[11px] font-medium text-[#315659] shadow-[0_8px_24px_rgba(37,48,49,0.08)] transition-colors duration-200 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-[#2978a0]/50 focus-visible:outline-offset-2"
              href="${project.repoUrl}"
              target="_blank"
              rel="noopener noreferrer"
            >
              ${GITHUB}
              <span>Open repository</span>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  override render() {
    if (this.projects.length === 0) return nothing;

    return html`
      <section class="mx-auto max-w-256 px-4 pb-24">
        <h2
          class="mt-6 text-2xl text-center font-syncopate font-semibold text-#2978A0"
        >
          FEATURED PROJECTS
        </h2>

        <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          ${this.projects.map((project) => this._renderProject(project))}
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
    "sec-project": SecProject;
  }
}
