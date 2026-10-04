import { css, html, LitElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";

const WORDS = [
  "APP",
  "INFRA",
  "SOFTWARE",
  "SYSTEMS",
  "LINUX",
  "WEBSITE",
  "AUTOMATION",
  "WORKFLOW",
  "CONTAINER",
  "VISION",
];

const PERIOD = 2300;

@customElement("el-scrolling-word")
export class ScrollingWord extends LitElement {
  static override styles = css`
    :host {
      display: inline-grid;
    }

    .old,
    .new {
      grid-area: 1 / 1;
      white-space: nowrap;
    }

    .old {
      animation: word-out 0.18s ease forwards;
    }

    .new {
      animation: word-in 0.25s ease 0.22s backwards;
    }

    @keyframes word-out {
      to {
        opacity: 0;
        transform: translateY(-0.25em);
      }
    }

    @keyframes word-in {
      from {
        opacity: 0;
        transform: translateY(0.25em);
      }
    }
  `;

  private _index = 0;

  private _prev?: number;

  private _timer?: ReturnType<typeof setInterval>;

  override connectedCallback() {
    super.connectedCallback();
    this._timer = setInterval(() => {
      this._prev = this._index;
      this._index = (this._index + 1) % WORDS.length;
      this.requestUpdate();
    }, PERIOD);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this._timer);
  }

  override render() {
    return html`
      ${
        this._prev === undefined
          ? nothing
          : keyed(
              `out-${this._prev}`,
              html`<span class="old">${WORDS[this._prev]}</span>`,
            )
      }
      ${keyed(
        `in-${this._index}`,
        html`<span class="new">${WORDS[this._index]}</span>`,
      )}
    `;
  }
}
