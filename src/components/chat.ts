import converse, { type Builder } from "@converse/headless";
import { css, html, LitElement, render } from "lit";
import { customElement } from "lit/decorators.js";

const XMPP_DOMAIN = "xmpp-anon.jianzcar.com.de";
const XMPP_WS = "wss://xmpp-anon.jianzcar.com.de:5281/xmpp-websocket";
const PERSONAL_JID = "iam@xmpp-pub.jianzcar.com.de";

type ChatConnection = {
  send: (stanza: Element | Builder) => void;
  addHandler: (
    handler: (stanza: Element) => boolean,
    ns: string | null,
    name: string | null,
  ) => void;
};

type ConverseApi = {
  connection: {
    get: () => ChatConnection | null;
  };
  listen: {
    on: (event: string, callback: () => void) => void;
  };
};

type Visitor = {
  name: string;
  email: string;
  jid: string;
  company: string;
};

const SINGLE_CHECK = html`
  <svg
    width="1.5em"
    height="1.5em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M5 12l5 5l10 -10" />
  </svg>
`;

const DOUBLE_CHECK = html`
  <svg
    width="1.5em"
    height="1.5em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M7 12l5 5l10 -10" />
    <path d="M2 12l5 5m5 -5l5 -5" />
  </svg>
`;

const CHAT = html`
  <svg
    width="1.5em"
    height="1.5em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path
      d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1"
    />
  </svg>
`;

const SEND = html`
  <svg
    width="1.5em"
    height="1.5em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path
      d="M4.698 4.034l16.302 7.966l-16.302 7.966a.503 .503 0 0 1 -.546 -.124a.555 .555 0 0 1 -.12 -.568l2.468 -7.274l-2.468 -7.274a.555 .555 0 0 1 .12 -.568a.503 .503 0 0 1 .546 -.124"
    />
    <path d="M6.5 12h14.5" />
  </svg>
`;

const MINIMIZE = html`
  <svg
    width="1.5em"
    height="1.5em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M4 11l8 3l8 -3" />
  </svg>
`;

@customElement("el-chat")
export class Chat extends LitElement {
  static override styles = css`
    :host {
      display: contents;
    }

    @unocss-placeholder;
  `;

  private _connection: ChatConnection | null = null;
  private _connected = false;
  private _initialized = false;
  private _initializing = false;
  private _visitor: Visitor | null = null;

  private _chat!: HTMLElement;
  private _minimizedButton!: HTMLButtonElement;
  private _messages!: HTMLElement;
  private _input!: HTMLTextAreaElement;
  private _send!: HTMLButtonElement;
  private _status!: HTMLElement;
  private _statusDot!: HTMLElement;
  private _typing!: HTMLElement;
  private _contactForm!: HTMLFormElement;
  private _contactView!: HTMLElement;
  private _chatBody!: HTMLElement;

  private _sentMessages = new Map<string, HTMLElement>();
  private _messageElements = new Map<string, HTMLElement>();
  private _lastReadMessageId: string | null = null;

  override render() {
    return html`
      <div class="fixed bottom-5 right-5 z-50 pointer-events-none">
        <div
          id="chat"
          class="w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/75 bg-white/65 text-[#253031] shadow-[0_20px_60px_rgba(37,48,49,0.14)] backdrop-blur-2xl origin-bottom-right opacity-0 scale-95 translate-y-2 pointer-events-none transition-all duration-300 ease-out"
        >
          <header
            class="flex h-16 items-center gap-3 border-b border-[#315659]/10 px-4 select-none"
          >
            <div class="relative shrink-0">
              <img
                src="https://api.dicebear.com/9.x/initials/svg?seed=JianZcar"
                class="h-10 w-10 rounded-full border border-white/80 bg-[#ccdde2] object-cover"
                alt="Avatar"
              />
              <span
                id="status-dot"
                class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#315659]"
              ></span>
            </div>

            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold text-[#253031]">
                JianZcar
              </div>
              <div id="status" class="truncate text-xs text-[#315659]/75">
                Start a conversation
              </div>
            </div>

            <button
              id="minimize"
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-[#315659]/75 transition hover:bg-[#ccdde2]/50 hover:text-[#253031]"
              aria-label="Minimize chat"
              aria-expanded="true"
            >
              ${MINIMIZE}
            </button>
          </header>

          <!-- First-message contact form -->
          <div id="contact-view">
            <form id="contact-form" class="space-y-3 p-4">
              <div>
                <div class="text-sm font-semibold text-[#253031]">
                  Start a conversation
                </div>
                <p class="mt-1 text-xs leading-relaxed text-[#315659]/70">
                  Please introduce yourself before sending your first message.
                </p>
              </div>

              <input
                name="name"
                type="text"
                required
                maxlength="100"
                autocomplete="name"
                placeholder="Your name"
                class="w-full rounded-xl border border-[#315659]/15 bg-white/60 px-3 py-2.5 text-sm text-[#253031] outline-none placeholder:text-[#315659]/50 focus:border-[#2978a0]/40 focus:ring-2 focus:ring-[#2978a0]/10"
              />

              <input
                name="email"
                type="email"
                required
                maxlength="254"
                autocomplete="email"
                placeholder="Email address"
                class="w-full rounded-xl border border-[#315659]/15 bg-white/60 px-3 py-2.5 text-sm text-[#253031] outline-none placeholder:text-[#315659]/50 focus:border-[#2978a0]/40 focus:ring-2 focus:ring-[#2978a0]/10"
              />

              <input
                name="jid"
                type="text"
                maxlength="3071"
                placeholder="XMPP JID (optional)"
                class="w-full rounded-xl border border-[#315659]/15 bg-white/60 px-3 py-2.5 text-sm text-[#253031] outline-none placeholder:text-[#315659]/50 focus:border-[#2978a0]/40 focus:ring-2 focus:ring-[#2978a0]/10"
              />

              <input
                name="company"
                type="text"
                required
                maxlength="150"
                autocomplete="organization"
                placeholder="Company / Organization"
                class="w-full rounded-xl border border-[#315659]/15 bg-white/60 px-3 py-2.5 text-sm text-[#253031] outline-none placeholder:text-[#315659]/50 focus:border-[#2978a0]/40 focus:ring-2 focus:ring-[#2978a0]/10"
              />

              <textarea
                name="message"
                required
                maxlength="5000"
                rows="3"
                placeholder="Your first message..."
                class="w-full resize-none rounded-xl border border-[#315659]/15 bg-white/60 px-3 py-2.5 text-sm text-[#253031] outline-none placeholder:text-[#315659]/50 focus:border-[#2978a0]/40 focus:ring-2 focus:ring-[#2978a0]/10"
              ></textarea>

              <button
                id="start-chat"
                type="submit"
                class="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#2978a0] text-sm font-medium text-white transition hover:bg-[#315659] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Start conversation ${SEND}
              </button>

              <p class="text-center text-[10px] text-[#315659]/50">
                Your details will be shared with JianZcar.
              </p>
            </form>
          </div>

          <!-- Regular chat -->
          <div id="chat-body" class="hidden">
            <main
              id="messages"
              class="h-[380px] space-y-3 overflow-y-auto p-4 text-sm scroll-smooth"
            ></main>

            <div
              id="typing"
              class="hidden px-4 pb-2 text-xs italic text-[#315659]/70"
            >
              JianZcar is typing...
            </div>

            <form
              id="composer"
              class="flex items-end gap-2 border-t border-[#315659]/10 bg-white/35 p-3"
            >
              <textarea
                id="input"
                rows="1"
                disabled
                placeholder="Type a message..."
                class="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-[#315659]/15 bg-white/60 px-3 py-2 text-sm text-[#253031] outline-none placeholder:text-[#315659]/50 focus:border-[#2978a0]/40 focus:ring-2 focus:ring-[#2978a0]/10"
              ></textarea>

              <button
                id="send"
                type="submit"
                disabled
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2978a0] text-white transition hover:bg-[#315659] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Send message"
              >
                ${SEND}
              </button>
            </form>
          </div>
        </div>

        <button
          id="minimized-button"
          type="button"
          aria-label="Open chat"
          aria-expanded="false"
          class="absolute bottom-0 right-0 flex h-12 w-12 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#2978a0] shadow-[0_12px_35px_rgba(37,48,49,0.16)] backdrop-blur-2xl opacity-100 scale-100 translate-y-0 pointer-events-auto transition-all duration-300 ease-out hover:scale-105 hover:bg-white/85 hover:text-[#315659]"
        >
          ${CHAT}
        </button>
      </div>
    `;
  }

  protected override async firstUpdated() {
    const root = this.renderRoot as ShadowRoot;

    const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
      root.getElementById(id) as T;

    this._chat = $("chat");
    this._minimizedButton = $("minimized-button");
    this._messages = $("messages");
    this._input = $("input");
    this._send = $("send");
    this._status = $("status");
    this._statusDot = $("status-dot");
    this._typing = $("typing");
    this._contactForm = $("contact-form");
    this._contactView = $("contact-view");
    this._chatBody = $("chat-body");

    $("composer").addEventListener("submit", (event) => {
      event.preventDefault();
      this._sendMessage();
    });

    this._contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this._submitFirstMessage();
    });

    this._input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this._sendMessage();
      }
    });

    this._input.addEventListener("input", () => {
      this._input.style.height = "auto";
      this._input.style.height = `${Math.min(this._input.scrollHeight, 128)}px`;

      if (this._connected) {
        this._sendChatState("composing");
      }
    });

    this._input.addEventListener("blur", () => {
      if (this._connected) {
        this._sendChatState("active");
      }
    });

    $("minimize").addEventListener("click", () => {
      this._setMinimized(true);
    });

    this._minimizedButton.addEventListener("click", () => {
      this._setMinimized(false);
    });

    this._setStatus("Start a conversation");
  }

  private _submitFirstMessage() {
    if (this._visitor) return;

    if (!this._contactForm.reportValidity()) return;

    const data = new FormData(this._contactForm);

    const visitor: Visitor = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      jid: String(data.get("jid") || "").trim(),
      company: String(data.get("company") || "").trim(),
    };

    const message = String(data.get("message") || "").trim();

    if (!visitor.name || !visitor.email || !visitor.company || !message) {
      return;
    }

    this._visitor = visitor;

    this._contactView.classList.add("hidden");
    this._chatBody.classList.remove("hidden");

    this._setStatus("Connecting...");

    this._initializeConverse();

    // Wait until XMPP connects before sending the first message.
    this._pendingFirstMessage = message;
  }

  private _pendingFirstMessage: string | null = null;

  private async _initializeConverse() {
    if (this._initialized || this._initializing) return;

    this._initializing = true;

    const self = this;

    try {
      converse.plugins.add("portfolio-chat", {
        initialize(this: {
          _converse: {
            api: ConverseApi;
          };
        }) {
          const api = this._converse.api;

          api.listen.on("connected", () => {
            self._connection = api.connection.get();

            if (!self._connection) {
              self._setStatus("Connection failed");
              return;
            }

            self._connected = true;

            self._connection.addHandler(self._handleMessage, null, "message");

            self._connection.addHandler(self._handlePresence, null, "presence");

            self._connection.send(
              converse.env.$pres({
                to: PERSONAL_JID,
                type: "subscribe",
              }),
            );

            self._connection.send(converse.env.$pres());

            self._input.disabled = false;
            self._send.disabled = false;

            self._setStatus("Offline · Usually replies in <1 hr");

            if (self._pendingFirstMessage) {
              self._sendFirstMessage(self._pendingFirstMessage);
              self._pendingFirstMessage = null;
            }
          });

          api.listen.on("disconnected", () => {
            self._connected = false;
            self._connection = null;

            self._input.disabled = true;
            self._send.disabled = true;

            self._typing.classList.add("hidden");

            self._setStatus("Disconnected");
          });
        },
      });

      await converse.initialize({
        jid: XMPP_DOMAIN,
        authentication: "anonymous",
        auto_login: true,
        websocket_url: XMPP_WS,
        discover_connection_methods: false,
        auto_reconnect: false,
        clear_cache: true,

        allow_non_roster_messaging: true,
        auto_subscribe: true,

        enable_smacks: false,
        send_chat_state_notifications: false,

        show_controlbox_by_default: false,
        auto_focus: false,
        render_emojis: false,
        use_emojione: false,

        loglevel: "warn",

        whitelisted_plugins: ["portfolio-chat"],

        blacklisted_plugins: [
          "converse-omemo",
          "converse-emoji",
          "converse-sm",
          "converse-smacks",
        ],
      });

      this._initialized = true;
    } catch (error) {
      console.error("Converse initialization failed:", error);
      this._setStatus("Connection failed");
    } finally {
      this._initializing = false;
    }
  }

  private _sendFirstMessage(message: string) {
    if (!this._connected || !this._visitor) return;

    const { name, email, jid, company } = this._visitor;

    const contactDetails = [
      `Name: ${name}`,
      `Email: ${email}`,
      `JID: ${jid || "Not provided"}`,
      `Company: ${company}`,
      "",
      "Message:",
      message,
    ].join("\n");

    this._sendXmppMessage(contactDetails);
  }

  private _setMinimized(minimized: boolean) {
    if (minimized) {
      this._chat.classList.remove(
        "opacity-100",
        "scale-100",
        "translate-y-0",
        "pointer-events-auto",
      );

      this._chat.classList.add(
        "opacity-0",
        "scale-95",
        "translate-y-2",
        "pointer-events-none",
      );

      this._minimizedButton.classList.remove(
        "opacity-0",
        "scale-75",
        "translate-y-2",
        "pointer-events-none",
      );

      this._minimizedButton.classList.add(
        "opacity-100",
        "scale-100",
        "translate-y-0",
        "pointer-events-auto",
      );

      this._minimizedButton.setAttribute("aria-expanded", "false");
      return;
    }

    this._minimizedButton.classList.remove(
      "opacity-100",
      "scale-100",
      "translate-y-0",
      "pointer-events-auto",
    );

    this._minimizedButton.classList.add(
      "opacity-0",
      "scale-75",
      "translate-y-2",
      "pointer-events-none",
    );

    this._chat.classList.remove(
      "opacity-0",
      "scale-95",
      "translate-y-2",
      "pointer-events-none",
    );

    this._chat.classList.add(
      "opacity-100",
      "scale-100",
      "translate-y-0",
      "pointer-events-auto",
    );

    this._minimizedButton.setAttribute("aria-expanded", "true");

    // Only initialize XMPP when the visitor opens the widget.
    if (!this._initialized && !this._visitor) {
      this._setStatus("Fill out the form to start");
    }

    requestAnimationFrame(() => {
      if (this._visitor) {
        this._input.focus();
      } else {
        this._contactForm
          .querySelector<HTMLInputElement>('input[name="name"]')
          ?.focus();
      }
    });
  }

  private _setStatus(text: string, online = false) {
    this._status.textContent = text;

    this._statusDot.className =
      "absolute bottom-0 right-0 h-3 w-3 " +
      "rounded-full border-2 border-white " +
      (online ? "bg-[#9ad5ca]" : "bg-[#315659]");
  }

  private _getTag(stanza: Element, name: string) {
    return [...stanza.getElementsByTagName("*")].find(
      (el) => el.localName === name,
    );
  }

  private _updateLastReadMarker(id: string | null = this._lastReadMessageId) {
    this._lastReadMessageId = id;

    this._messages.querySelector(".read-marker")?.remove();

    if (!id) return;

    const target = this._messageElements.get(id);
    if (!target) return;

    const all = [...this._messages.querySelectorAll(".message-item")];

    if (target === all[all.length - 1]) return;

    const marker = document.createElement("div");

    marker.className =
      "read-marker my-2 flex items-center " +
      "justify-center gap-2 text-[11px] " +
      "text-[#315659]/70 select-none";

    marker.innerHTML = `
      <div class="h-px flex-1 bg-[#315659]/12"></div>
      <span>^^ Read by JianZcar ^^</span>
      <div class="h-px flex-1 bg-[#315659]/12"></div>
    `;

    target.insertAdjacentElement("afterend", marker);
  }

  private _addMessage(
    text: string,
    outgoing: boolean,
    id: string | null = null,
  ) {
    if (!text) return;

    const wrapper = document.createElement("div");

    wrapper.className =
      "message-item flex " + (outgoing ? "justify-end" : "justify-start");

    wrapper.dataset.outgoing = outgoing ? "true" : "false";

    const bubble = document.createElement("div");

    bubble.className = outgoing
      ? "max-w-[80%] rounded-2xl rounded-br-none " +
        "bg-[#2978a0] px-3.5 py-2 text-sm " +
        "leading-relaxed text-white break-words shadow-sm"
      : "max-w-[80%] rounded-2xl rounded-bl-none " +
        "border border-white/70 bg-[#ccdde2]/70 " +
        "px-3.5 py-2 text-sm leading-relaxed " +
        "text-[#253031] break-words shadow-sm";

    const textEl = document.createElement("div");
    textEl.className = "whitespace-pre-wrap break-words";
    textEl.textContent = text;
    bubble.appendChild(textEl);

    if (outgoing) {
      this._messages
        .querySelectorAll(".message-meta")
        .forEach((el) => el.remove());

      const meta = document.createElement("div");

      meta.className =
        "message-meta mt-0.5 flex justify-end text-[10px] text-white/65";

      render(SINGLE_CHECK, meta);
      bubble.appendChild(meta);

      if (id) this._sentMessages.set(id, meta);
    } else {
      this._lastReadMessageId = id;
    }

    wrapper.appendChild(bubble);
    this._messages.appendChild(wrapper);

    if (id) this._messageElements.set(id, wrapper);

    this._updateLastReadMarker();
    this._messages.scrollTop = this._messages.scrollHeight;
  }

  private _markDelivered(id: string) {
    const el = this._sentMessages.get(id);

    if (!el || el.dataset.state === "read") return;

    el.dataset.state = "delivered";
    render(DOUBLE_CHECK, el);
  }

  private _markRead(id: string) {
    const el = this._sentMessages.get(id);

    if (el) {
      el.dataset.state = "read";

      el.className =
        "message-meta mt-0.5 flex justify-end text-[10px] text-[#9ad5ca]";

      render(DOUBLE_CHECK, el);
    }

    this._updateLastReadMarker(id);
  }

  private _handleMessage = (stanza: Element) => {
    const from = stanza.getAttribute("from")?.split("/")[0];

    if (from !== PERSONAL_JID) return true;

    const receipt = this._getTag(stanza, "received");

    const displayed =
      this._getTag(stanza, "displayed") || this._getTag(stanza, "acknowledged");

    if (receipt?.getAttribute("id")) {
      this._markDelivered(receipt.getAttribute("id") as string);
    }

    if (displayed?.getAttribute("id")) {
      this._markRead(displayed.getAttribute("id") as string);
    }

    const composing = this._getTag(stanza, "composing");
    this._typing.classList.toggle("hidden", !composing);

    const text = this._getTag(stanza, "body")?.textContent?.trim();

    if (!text) return true;

    const id = stanza.getAttribute("id");

    this._addMessage(text, false, id);
    this._typing.classList.add("hidden");

    const { $msg } = converse.env;

    this._connection!.send(
      $msg({
        to: stanza.getAttribute("from") as string,
        type: "chat",
      }).c("received", {
        xmlns: "urn:xmpp:receipts",
        id,
      }),
    );

    this._connection!.send(
      $msg({
        to: stanza.getAttribute("from") as string,
        type: "chat",
      }).c("displayed", {
        xmlns: "urn:xmpp:chat-markers:0",
        id,
      }),
    );

    return true;
  };

  private _handlePresence = (stanza: Element) => {
    const from = stanza.getAttribute("from")?.split("/")[0];

    if (from !== PERSONAL_JID) return true;

    const type = stanza.getAttribute("type");

    if (type === "unavailable" || type === "unsubscribed") {
      this._setStatus("Offline · Usually replies in <1 hr");
      this._typing.classList.add("hidden");
    } else {
      this._setStatus("Online", true);
    }

    return true;
  };

  private _sendChatState(state: string) {
    if (!this._connected) return;

    this._connection!.send(
      converse.env
        .$msg({
          to: PERSONAL_JID,
          type: "chat",
        })
        .c(state, {
          xmlns: "http://jabber.org/protocol/chatstates",
        }),
    );
  }

  private _sendXmppMessage(text: string) {
    if (!this._connected || !text) return;

    const id = crypto.randomUUID();

    const stanza = converse.env
      .$msg({
        to: PERSONAL_JID,
        type: "chat",
        id,
      })
      .c("body")
      .t(text)
      .up()
      .c("request", {
        xmlns: "urn:xmpp:receipts",
      })
      .up()
      .c("markable", {
        xmlns: "urn:xmpp:chat-markers:0",
      })
      .up()
      .c("active", {
        xmlns: "http://jabber.org/protocol/chatstates",
      });

    this._connection!.send(stanza);
    this._addMessage(text, true, id);
  }

  private _sendMessage() {
    if (!this._connected) return;

    const text = this._input.value.trim();
    if (!text) return;

    this._sendXmppMessage(text);

    this._input.value = "";
    this._input.style.height = "auto";

    this._sendChatState("active");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "el-chat": Chat;
  }
}
