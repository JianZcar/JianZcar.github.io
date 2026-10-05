import { css, html, LitElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";

import { CERTIFICATES, type Certificate } from "../data/certificates";

const GAP = 24;
const DEFAULT_SPEED = 40;
const DEFAULT_CARD_WIDTH = 340;
const MIN_DURATION = 20;
const MAX_DURATION = 240;
const SRCSET_WIDTHS = [480, 680, 960];
const MIDDLE_WIDTH = SRCSET_WIDTHS[1];

/* Blur curve: the strip showing `ratio` of its height gets maxBlur * (1 - ratio^curve). */
const DEFAULT_MAX_BLUR = 10;
const DEFAULT_BLUR_CURVE = 2;

/**
 * Observer granularity for the single strip target. The CSS transition absorbs
 * what is left, so this only needs to be coarse enough to stay cheap on scroll.
 */
const OBSERVER_STEPS = 24;

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
  private _revealed = false;

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
    // passes must not read layout again or re-apply the instant first frame.
    if (this._observer) {
      this._observer.observe(strip);

      return;
    }

    // Applied synchronously, because the observer's first callback can arrive
    // more than a second late for a strip that starts outside the viewport.
    const reveal = this._revealOf(strip);
    if (reveal >= 1) {
      this._lockSharp();

      return;
    }

    this._setBlur(this._blurFor(reveal), true);

    this._observer ??= new IntersectionObserver(this._onStripIntersect, {
      threshold: Array.from(
        { length: OBSERVER_STEPS },
        (_, i) => i / (OBSERVER_STEPS - 1),
      ),
    });

    this._observer.observe(strip);
  }

  private _revealOf(strip: HTMLElement) {
    const box = strip.getBoundingClientRect();
    if (box.height <= 0) return 0;

    const visible = Math.max(
      0,
      Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0),
    );

    return Math.min(1, visible / box.height);
  }

  private _lockSharp() {
    this._revealed = true;
    this._observer?.disconnect();
    this._observer = undefined;
    this._setBlur(0);
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

    this._setBlur(this._blurFor(entry.intersectionRatio));
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
    if (this._maxBlur <= 0) return 0;

    return this._maxBlur * (1 - Math.pow(ratio, this._blurCurve));
  }

  private _duration() {
    const groupWidth = this.certificates.length * (this.cardWidth + GAP);
    const seconds = groupWidth / Math.max(this.speed, 1);

    return Math.min(MAX_DURATION, Math.max(MIN_DURATION, seconds));
  }

  private _renderItem(certificate: Certificate) {
    return html`
      <li class="shrink-0 pe-6">
        <figure class="card m-0">
          <div
            class="frame overflow-hidden rounded-2xl border border-white/75 bg-white/65 shadow-[0_20px_60px_rgba(37,48,49,0.14)]"
          >
            <img
              src="${certificate.image}-${MIDDLE_WIDTH}.webp"
              srcset=${SRCSET_WIDTHS.map(
                (width) => `${certificate.image}-${width}.webp ${width}w`,
              ).join(", ")}
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

    const items = this.certificates.map((certificate) =>
      this._renderItem(certificate),
    );

    return html`
      <section class="mx-auto max-w-256 py-24 sm:pt-48">
        <div
          class="viewport relative overflow-hidden py-2"
          style="--marquee-duration: ${this._duration()}s"
        >
          <div class="track flex w-max">
            <ul class="m-0 flex list-none shrink-0 p-0" role="list">
              ${items}
            </ul>
            <ul
              class="m-0 flex list-none shrink-0 p-0"
              role="list"
              aria-hidden="true"
            >
              ${items}
            </ul>
          </div>
        </div>
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

    .frame {
      width: var(--cert-w);
    }

    .card {
      width: var(--cert-w);
    }

    @keyframes cert-marquee {
      from {
        transform: translate3d(0, 0, 0);
      }

      to {
        transform: translate3d(-50%, 0, 0);
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
