if ("__TAURI__" in window) {
  var tauri_plugin_gamepad_api = (function (e) {
    "use strict";
    function n(e, n = !1) {
      return window.__TAURI_INTERNALS__.transformCallback(e, n);
    }
    async function t(e, n = {}, t) {
      return window.__TAURI_INTERNALS__.invoke(e, n, t);
    }
    var a;
    async function i(e, a, i) {
      const r = { kind: "Any" };
      return t("plugin:event|listen", {
        event: e,
        target: r,
        handler: n(a),
      }).then(
        (n) => async () =>
          (async function (e, n) {
            await t("plugin:event|unlisten", { event: e, eventId: n });
          })(e, n),
      );
    }
    "function" == typeof SuppressedError && SuppressedError,
      (function (e) {
        (e.WINDOW_RESIZED = "tauri://resize"),
          (e.WINDOW_MOVED = "tauri://move"),
          (e.WINDOW_CLOSE_REQUESTED = "tauri://close-requested"),
          (e.WINDOW_DESTROYED = "tauri://destroyed"),
          (e.WINDOW_FOCUS = "tauri://focus"),
          (e.WINDOW_BLUR = "tauri://blur"),
          (e.WINDOW_SCALE_FACTOR_CHANGED = "tauri://scale-change"),
          (e.WINDOW_THEME_CHANGED = "tauri://theme-changed"),
          (e.WINDOW_CREATED = "tauri://window-created"),
          (e.WEBVIEW_CREATED = "tauri://webview-created"),
          (e.DRAG_ENTER = "tauri://drag-enter"),
          (e.DRAG_OVER = "tauri://drag-over"),
          (e.DRAG_DROP = "tauri://drag-drop"),
          (e.DRAG_LEAVE = "tauri://drag-leave");
      })(a || (a = {}));
    let r,
      u = null,
      d = [];
    const c = () => (0 == d.length ? [null, null, null, null] : d);
    t("plugin:gamepad|execute"),
      (navigator.getGamepads = c),
      (r = i("event", (e) => {
        const { payload: n } = e;
        let t = o(n),
          a = !1;
        if (
          ((d = d.map((e) =>
            e.id === t.id && e.index === t.index ? ((a = !0), t) : e,
          )),
          a || d.push(t),
          "Connected" === n.event)
        ) {
          let e = new Event("gamepadconnected");
          (e.gamepad = t), window.dispatchEvent(e);
        }
        if ("Disconnected" === n.event) {
          let e = new Event("gamepaddisconnected");
          (e.gamepad = t),
            window.dispatchEvent(e),
            (d = d.filter((e) => e.index !== t.index));
        }
        null !== u && u(n);
      }));
    const o = (e) => {
      const {
        id: n,
        axes: t,
        connected: a,
        name: i,
        timestamp: r,
        uuid: u,
        mapping: d,
      } = e;
      return {
        index: n,
        id: `${i} (${u})`,
        connected: a,
        axes: t,
        buttons: e.buttons.map((e) => ({
          value: e,
          touched: !1,
          pressed: e > 0,
        })),
        timestamp: r,
        mapping: d,
        hapticActuators: [],
        vibrationActuator: null,
      };
    };
    return (e.execute = async (e) => ((u = e), r)), (e.getGamepads = c), e;
  })({});
  Object.defineProperty(window.__TAURI__, "tauri_plugin_gamepad_api", {
    value: tauri_plugin_gamepad_api,
  });
}
