import { css, html, LitElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";

import { CERTIFICATES, type Certificate } from "../data/certificates";
import {
  blurFor,
  DEFAULT_BLUR_CURVE,
  DEFAULT_CARD_WIDTH,
  DEFAULT_MAX_BLUR,
  DEFAULT_SPEED,
  marqueeDuration,
  MIDDLE_WIDTH,
  revealThresholds,
  srcSet,
} from "../lib/cert";

/** Exit animation for the grid before the marquee takes its place back. */
const COLLAPSE_MS = 300;

const CHEVRON = html`
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
    <path d="m6 9 6 6 6-6" />
  </svg>
`;

@customElement("sec-cert")
export class SecCert extends LitElement {
  static override get observedAttributes(): string[] {
    return [
      ...super.observedAttributes,
      "speed",
      "card-width",
      "max-blur",
      "blur-curve",
    ];
  }

  private _certificates: Certificate[] = [...CERTIFICATES];
  private _speed = DEFAULT_SPEED;
  private _cardWidth = DEFAULT_CARD_WIDTH;
  private _maxBlur = DEFAULT_MAX_BLUR;
  private _blurCurve = DEFAULT_BLUR_CURVE;
  private _observer?: IntersectionObserver;
  private _blurApplied = false;
  private _revealed = false;
  private _expanded = false;
  private _collapsing = false;
  private _collapseTimer: number | undefined;

  get certificates() {
    return this._certificates;
  }

  set certificates(value: Certificate[]) {
    if (this._certificates === value) return;

    this._certificates = value;
    this.requestUpdate();
  }

  get speed() {
    return this._speed;
  }

  set speed(value: number) {
    if (this._speed === value) return;

    this._speed = value;
    this.requestUpdate();
  }

  get cardWidth() {
    return this._cardWidth;
  }

  set cardWidth(value: number) {
    if (this._cardWidth === value) return;

    this._cardWidth = value;
    this.requestUpdate();
  }

  /** Blur radius in px applied while the strip is not fully revealed. */
  get maxBlur() {
    return this._maxBlur;
  }

  set maxBlur(value: number) {
    this._maxBlur = value;
  }

  /**
   * Sharpness curve against vertical reveal. 1 fades linearly, 2 keeps the
   * strip soft until it is most of the way into view, 0.5 sharpens early.
   */
  get blurCurve() {
    return this._blurCurve;
  }

  set blurCurve(value: number) {
    this._blurCurve = value;
  }

  public override attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null,
  ) {
    if (value === null) return;

    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return;

    if (name === "speed") this.speed = parsed;
    if (name === "card-width") this.cardWidth = parsed;
    if (name === "max-blur") this.maxBlur = parsed;
    if (name === "blur-curve") this.blurCurve = parsed;
  }

  override connectedCallback() {
    super.connectedCallback();

    const blur = this.getAttribute("max-blur");
    const curve = this.getAttribute("blur-curve");

    if (blur !== null) this.maxBlur = Number.parseFloat(blur);
    if (curve !== null) this.blurCurve = Number.parseFloat(curve);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this._observer?.disconnect();
    this._observer = undefined;

    // Land the pending collapse instead of leaving the flag stuck true.
    if (this._collapseTimer !== undefined) {
      window.clearTimeout(this._collapseTimer);
      this._collapseTimer = undefined;
      this._expanded = false;
      this._collapsing = false;
    }
  }

  protected override firstUpdated() {
    this._observeStrip();
  }

  protected override updated() {
    this._observeStrip();
  }

  override willUpdate() {
    this.style.setProperty("--cert-w", `${this.cardWidth}px`);
  }

  private _observeStrip() {
    if (this._revealed) return;

    const strip = this.renderRoot.querySelector<HTMLElement>(".viewport");
    if (!strip) return;

    // Once the observer owns the strip it reports every change, so later render
    // passes must not re-observe or re-apply the opening frame.
    if (this._observer) {
      this._observer.observe(strip);

      return;
    }

    // No layout read here: measuring the strip forces a synchronous relayout of
    // the freshly inserted section, which shows up as a long task on load. The
    // observer's first entry carries the same ratio, and for a strip that is on
    // screen it lands before the first paint, so the opening blur never flashes.
    // A strip outside the viewport starts sharp and is off screen anyway.
    this._observer = new IntersectionObserver(this._onStripIntersect, {
      threshold: revealThresholds(),
    });

    this._observer.observe(strip);
  }

  private _lockSharp() {
    this._revealed = true;
    this._observer?.disconnect();
    this._observer = undefined;
    this._setBlur(0);
    this.requestUpdate();
  }

  /**
   * The strip is narrower than any viewport, so the ratio is purely how much of
   * its height has scrolled into view. Cards sliding past horizontally never
   * affect it, which keeps one blur for the whole carousel instead of a value
   * per card.
   */
  private _onStripIntersect: IntersectionObserverCallback = (entries) => {
    const entry = entries[entries.length - 1];
    if (!entry) return;

    if (entry.intersectionRatio >= 1) {
      // Revealed once, sharp for good. Scrolling back past it must not start
      // softening the section the user is trying to read.
      this._lockSharp();

      return;
    }

    // The opening value must not fade in from sharp, so the first entry lands
    // without the transition. Everything after it follows the scroll.
    const opening = !this._blurApplied;
    this._blurApplied = true;
    this._setBlur(this._blurFor(entry.intersectionRatio), opening);
  };

  private _setBlur(blur: number, instant = false) {
    const strip = this.renderRoot.querySelector<HTMLElement>(".viewport");
    if (!strip) return;

    const value = blur < 0.05 ? "none" : `blur(${blur.toFixed(2)}px)`;

    if (instant) {
      // The opening value must not fade in from sharp, so hold the transition
      // off for the frame that applies it.
      strip.style.transition = "none";
      strip.style.filter = value;

      requestAnimationFrame(() => {
        strip.style.transition = "";
      });

      return;
    }

    strip.style.filter = value;
  }

  private _blurFor(ratio: number) {
    return blurFor(ratio, this._maxBlur, this._blurCurve);
  }

  private _duration() {
    return marqueeDuration(
      this.certificates.length,
      this.cardWidth,
      this.speed,
    );
  }

  private _toggle = () => {
    // A click during the exit animation cancels it and keeps the grid open.
    if (this._collapsing) {
      window.clearTimeout(this._collapseTimer);
      this._collapseTimer = undefined;
      this._collapsing = false;
      this.requestUpdate();

      return;
    }

    if (!this._expanded) {
      this._expanded = true;
      this.requestUpdate();

      return;
    }

    this._collapsing = true;
    this.requestUpdate();

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this._collapseTimer = window.setTimeout(
      () => {
        this._collapseTimer = undefined;
        this._collapsing = false;
        this._expanded = false;
        this.requestUpdate();
      },
      reduced ? 0 : COLLAPSE_MS,
    );
  };

  private _renderItem(certificate: Certificate, grid = false) {
    const card = grid
      ? "mx-auto w-full max-w-[var(--cert-w)]"
      : "w-[var(--cert-w)]";

    return html`
      <li class="${grid ? "min-w-0" : "shrink-0 pe-6"}">
        <figure class="m-0 ${card}">
          <div
            class="overflow-hidden rounded-2xl border border-white/75 bg-white/65 shadow-[0_20px_60px_rgba(37,48,49,0.14)]"
          >
            <img
              src="${certificate.image}-${MIDDLE_WIDTH}.webp"
              srcset=${srcSet(certificate.image)}
              sizes="${this.cardWidth}px"
              width="1600"
              height="1200"
              alt=${certificate.title}
              loading="lazy"
              decoding="async"
              class="block h-auto w-full"
            />
          </div>

          <figcaption class="mt-3 px-2 text-center">
            <span class="block text-xs font-semibold text-[#253031]">
              ${certificate.title}
            </span>
            ${
              certificate.issuer
                ? html`
                    <span class="block text-[10px] text-[#315659]">
                      ${certificate.issuer}
                    </span>
                  `
                : nothing
            }
          </figcaption>
        </figure>
      </li>
    `;
  }

  override render() {
    if (this.certificates.length === 0) return nothing;

    const items = (grid: boolean) =>
      this.certificates.map((certificate) =>
        this._renderItem(certificate, grid),
      );

    const open = this._expanded && !this._collapsing;

    const toggleState = this._revealed
      ? "pointer-events-auto opacity-100"
      : "pointer-events-none opacity-0 [translate:0_4rem]";

    const toggleTone = open
      ? "border-white/75 bg-white/60 text-[#253031]/85"
      : "border-white/60 bg-white/40 text-[#315659]/70";

    const gridState = this._collapsing
      ? "opacity-0 [translate:0_1rem] transition-all duration-300 ease-out motion-reduce:transition-none"
      : "animate-[cert-in_320ms_ease-out] motion-reduce:animate-none";

    return html`
      <section class="mx-auto max-w-256 pb-24">
        <div
          class="mt-6 flex justify-center transition duration-500 ease-out motion-reduce:transition-none ${toggleState}"
          ?inert="${!this._revealed}"
          ?aria-hidden="${!this._revealed}"
        >
          <button
            type="button"
            class="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-4 text-xs font-medium tracking-[0.08em] uppercase shadow-[0_12px_35px_rgba(37,48,49,0.1)] backdrop-blur-2xl transition-colors duration-300 ease-out hover:border-white/85 hover:bg-white/70 hover:text-[#253031]/90 active:bg-white/80 focus-visible:outline-2 focus-visible:outline-[#2978a0]/50 focus-visible:outline-offset-2 motion-reduce:transition-none ${toggleTone}"
            aria-expanded="${open}"
            @click="${this._toggle}"
          >
            <span
              class="inline-flex transition-transform duration-300 ease-out motion-reduce:transition-none ${
                open ? "rotate-180" : ""
              }"
            >
              ${CHEVRON}
            </span>
            <span>${open ? "Show less" : "Show all"}</span>
          </button>
        </div>

        ${
          this._expanded
            ? html`
                <ul
                  class="m-0 mt-6 grid list-none grid-cols-1 gap-6 p-0 px-4 sm:grid-cols-2 lg:grid-cols-3 ${gridState}"
                  role="list"
                >
                  ${items(true)}
                </ul>
              `
            : html`
                <div
                  class="viewport relative mt-6 overflow-hidden py-2"
                  style="--marquee-duration: ${this._duration()}s"
                >
                  <div class="track flex w-max">
                    <ul class="m-0 flex list-none shrink-0 p-0" role="list">
                      ${items(false)}
                    </ul>
                    <ul
                      class="m-0 flex list-none shrink-0 p-0"
                      role="list"
                      aria-hidden="true"
                    >
                      ${items(false)}
                    </ul>
                  </div>
                </div>
              `
        }
      </section>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      --cert-w: 340px;
      --cert-fade: 4rem;

      --cert-fade-color: #c6e0ff;
    }

    @unocss-placeholder .track {
      animation: cert-marquee var(--marquee-duration) linear infinite;
    }

    .track:hover,
    .track:focus-within {
      animation-play-state: paused;
    }

    .viewport {
      transition: filter 320ms ease-out;
    }

    .viewport::before,
    .viewport::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      z-index: 1;
      width: var(--cert-fade);
      pointer-events: none;
    }

    .viewport::before {
      left: 0;
      background: linear-gradient(
        to right,
        var(--cert-fade-color),
        transparent
      );
    }

    .viewport::after {
      right: 0;
      background: linear-gradient(to left, var(--cert-fade-color), transparent);
    }

    @keyframes cert-marquee {
      from {
        transform: translate3d(0, 0, 0);
      }

      to {
        transform: translate3d(-50%, 0, 0);
      }
    }

    @keyframes cert-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (min-width: 640px) {
      :host {
        --cert-fade: 6rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .track {
        animation: none;
      }

      .viewport {
        overflow-x: auto;
        transition: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "sec-cert": SecCert;
  }
}
