import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("page-about")
export class PageAbout extends LitElement {
	static override styles = css`@unocss-placeholder`;

	override render() {
		return html`
      <section>
        <h1>About Page</h1>
        <p>Learn more about this application.</p>
        <a href="/">Go to Home</a>
      </section>
    `;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"page-about": PageAbout;
	}
}
