import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("page-not-found")
export class PageNotFound extends LitElement {
	static override styles = css`@unocss-placeholder`;

	override render() {
		return html`
      <section>
        <h1>Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <a href="/">Go to Home</a>
      </section>
    `;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		"page-not-found": PageNotFound;
	}
}
