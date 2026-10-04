import "./global.css";
import { Router } from "@lit-labs/router";
import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("app-root")
export class RootElement extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #c6e0ff;
    }
    @unocss-placeholder;
  `;

  private _routes = new Router(this, [
    {
      path: "/",
      enter: async () => {
        await import("./pages/home");
        return true;
      },
      render: () => html`<page-home></page-home>`,
    },
    {
      path: "/home",
      enter: async () => {
        await import("./pages/home");
        return true;
      },
      render: () => html`<page-home></page-home>`,
    },
    {
      path: "/about",
      enter: async () => {
        await import("./pages/about");
        return true;
      },
      render: () => html`<page-about></page-about>`,
    },
    {
      path: "/*",
      enter: async () => {
        await import("./pages/page-not-found");
        return true;
      },
      render: () => html`<page-not-found></page-not-found>`,
    },
  ]);

  override render() {
    return html`${this._routes.outlet()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "app-root": RootElement;
  }
}
