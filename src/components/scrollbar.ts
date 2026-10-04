import { css } from "lit";

/**
 * ::-webkit-scrollbar pseudo-elements do not cross shadow boundaries, so any
 * scrollable area inside a component needs these rules in its own shadow root.
 * `scrollbar-width` and `scrollbar-color` inherit, which covers Firefox.
 *
 * Colors resolve from the custom properties declared in index.html, with
 * fallbacks so the component still renders correctly if it is used standalone.
 */
export const SCROLLBAR_STYLES = css`
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb, #9ad5ca) transparent;
  }

  ::-webkit-scrollbar {
    width: var(--scrollbar-size, 10px);
    height: var(--scrollbar-size, 10px);
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: var(--scrollbar-thumb, #9ad5ca);
    border: 2px solid transparent;
    border-radius: 999px;
    background-clip: content-box;
    transition: background-color 0.2s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: var(--scrollbar-thumb-hover, #2978a0);
  }

  ::-webkit-scrollbar-thumb:active {
    background-color: var(--scrollbar-thumb-active, #315659);
  }

  ::-webkit-scrollbar-corner {
    background: transparent;
  }
`;