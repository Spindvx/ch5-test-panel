/**
 * MainPage — runtime hooks
 * Defaults the right pane to NVX (digital join 2) on cold start so the
 * panel never lands on an empty pane. SIMPL is the source of truth
 * during normal operation; this only fires once at page-load before
 * any join traffic arrives.
 */
(function () {
  "use strict";

  function defaultToNvx() {
    if (typeof CrComLib === "undefined" || !CrComLib.Ch5SignalFactory) {
      setTimeout(defaultToNvx, 200);
      return;
    }
    try {
      CrComLib.Ch5SignalFactory.getInstance()
        .getBooleanSignal("2", true)
        .publish(true);
    } catch (e) {
      /* no-op — SIMPL will drive the show signal as soon as it connects */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", defaultToNvx);
  } else {
    defaultToNvx();
  }
})();
