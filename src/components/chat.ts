import converse, { type Builder } from "@converse/headless";
import { css, html, LitElement } from "lit";
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
  connection: { get: () => ChatConnection | null };
  listen: { on: (event: string, callback: () => void) => void };
};

const SINGLE_CHECK = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.5" class="h-3.5 w-3.5">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M4.5 12.75l6 6 9-13.5" />
  </svg>`;

const DOUBLE_CHECK = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.5" class="h-3.5 w-3.5">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M2 13l5 5L18 6M8 13l5 5L22 6" />
  </svg>`;

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

  private _messages!: HTMLElement;

  private _input!: HTMLTextAreaElement;

  private _send!: HTMLButtonElement;

  private _status!: HTMLElement;

  private _statusDot!: HTMLElement;

  private _typing!: HTMLElement;

  private _chatBody!: HTMLElement;

  private _sentMessages = new Map<string, HTMLElement>();

  private _messageElements = new Map<string, HTMLElement>();

  private _lastReadMessageId: string | null = null;

  override render() {
    return html`
      <div
        id="chat"
        class="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 text-white shadow-2xl backdrop-blur-xl"
      >
        <header
          class="flex h-16 items-center gap-3 border-b border-white/10 px-4 select-none"
        >
          <div class="relative shrink-0">
            <img
              src="https://api.dicebear.com/9.x/initials/svg?seed=JianZcar"
              class="h-10 w-10 rounded-full bg-zinc-800 object-cover"
              alt="Avatar"
            />

            <span
              id="status-dot"
              class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-950 bg-zinc-500"
            ></span>
          </div>

          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-medium">JianZcar</div>
            <div id="status" class="truncate text-xs text-zinc-400">
              Connecting...
            </div>
          </div>

          <button
            id="minimize"
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Minimize chat"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="h-4 w-4"
            >
              <path d="M5 12h14" />
            </svg>
          </button>
        </header>

        <div id="chat-body">
          <main
            id="messages"
            class="h-[380px] space-y-3 overflow-y-auto p-4 text-sm scroll-smooth"
          ></main>

          <div
            id="typing"
            class="hidden px-4 pb-2 text-xs italic text-zinc-400"
          >
            JianZcar is typing...
          </div>

          <form
            id="composer"
            class="flex items-end gap-2 border-t border-white/10 bg-zinc-900/50 p-3"
          >
            <textarea
              id="input"
              rows="1"
              disabled
              placeholder="Type a message..."
              class="max-h-32 min-h-[40px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/20"
            ></textarea>

            <button
              id="send"
              type="submit"
              disabled
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Send message"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="h-4 w-4"
              >
                <path d="m5 12 14-7-7 14-2-6-5-1Z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  protected override async firstUpdated() {
    const root = this.renderRoot as ShadowRoot;
    const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
      root.getElementById(id) as T;

    this._messages = $("messages");
    this._input = $<HTMLTextAreaElement>("input");
    this._send = $<HTMLButtonElement>("send");
    this._status = $("status");
    this._statusDot = $("status-dot");
    this._typing = $("typing");
    this._chatBody = $("chat-body");

    $<HTMLFormElement>("composer").addEventListener("submit", (event) => {
      event.preventDefault();
      this._sendMessage();
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
      this._chatBody.classList.toggle("hidden");
    });

    const self = this;

    converse.plugins.add("portfolio-chat", {
      initialize(this: { _converse: { api: ConverseApi } }) {
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

    this._setStatus("Connecting...");

    try {
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
    } catch (error) {
      console.error("Converse initialization failed:", error);
      this._setStatus("Connection failed");
    }
  }

  private _setStatus(text: string, online = false) {
    this._status.textContent = text;

    this._statusDot.className =
      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-950 " +
      (online ? "bg-emerald-400" : "bg-zinc-500");
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
      "read-marker my-2 flex items-center justify-center gap-2 " +
      "text-[11px] text-zinc-500 select-none";

    marker.innerHTML = `
      <div class="h-px flex-1 bg-white/10"></div>
      <span>^^ Read by JianZcar ^^</span>
      <div class="h-px flex-1 bg-white/10"></div>
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
      ? "max-w-[80%] rounded-2xl rounded-br-none bg-white px-3.5 py-2 text-sm leading-relaxed text-black break-words"
      : "max-w-[80%] rounded-2xl rounded-bl-none border border-white/5 bg-white/10 px-3.5 py-2 text-sm leading-relaxed text-white break-words";

    const textEl = document.createElement("div");
    textEl.textContent = text;
    bubble.appendChild(textEl);

    if (outgoing) {
      this._messages.querySelectorAll(".message-meta").forEach((el) => {
        el.remove();
      });

      const meta = document.createElement("div");

      meta.className =
        "message-meta mt-0.5 flex justify-end text-[10px] text-zinc-400";

      meta.innerHTML = SINGLE_CHECK;

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
    el.innerHTML = DOUBLE_CHECK;
  }

  private _markRead(id: string) {
    const el = this._sentMessages.get(id);

    if (el) {
      el.dataset.state = "read";
      el.className =
        "message-meta mt-0.5 flex justify-end text-[10px] text-sky-400";
      el.innerHTML = DOUBLE_CHECK;
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

  private _sendMessage() {
    if (!this._connected) return;

    const text = this._input.value.trim();
    if (!text) return;

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
