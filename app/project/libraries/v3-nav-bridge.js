/**
 * Office V3 — Navigation Bridge
 * ----------------------------------------------------------------
 * Bidirectional join↔page mapping per Josh's spec:
 *   1  → menu        (home)
 *   2  → nvxControl
 *   3  → qsysLevels
 *   4  → volume
 *   5  → clock
 *   6  → settings
 *   25 → appleTv
 *
 * Behavior:
 *   • Control system asserts digital join N → panel navigates to mapped page.
 *   • User taps a sidebar button → panel navigates locally AND pulses join N
 *     so the control system knows what page is on screen.
 *
 * Depends on:
 *   • CrComLib.publishEvent / subscribeState (loaded by ch5-crcomlib)
 *   • templatePageModule.navigateTriggerViewByPageName (shell template)
 */
(function () {
  "use strict";

  var PAGE_TO_JOIN = {
    menu:       "1",
    nvxControl: "2",
    qsysLevels: "3",
    volume:     "4",
    clock:      "5",
    settings:   "6",
    appleTv:    "25"
  };
  var JOIN_TO_PAGE = Object.keys(PAGE_TO_JOIN).reduce(function (acc, k) {
    acc[PAGE_TO_JOIN[k]] = k;
    return acc;
  }, {});

  function isReady() {
    return (typeof CrComLib !== "undefined") &&
           (typeof templatePageModule !== "undefined") &&
           (typeof templatePageModule.navigateTriggerViewByPageName === "function");
  }

  function pulseJoin(join) {
    try {
      CrComLib.publishEvent("b", join, true);
      // 100 ms hold then release — standard digital pulse
      setTimeout(function () { CrComLib.publishEvent("b", join, false); }, 100);
    } catch (e) {
      console.warn("[v3-nav] pulse failed for join", join, e);
    }
  }

  function navigateTo(pageName) {
    try {
      templatePageModule.navigateTriggerViewByPageName(pageName);
    } catch (e) {
      console.warn("[v3-nav] navigate failed for", pageName, e);
    }
  }

  function subscribeIncomingJoins() {
    Object.keys(JOIN_TO_PAGE).forEach(function (join) {
      var pageName = JOIN_TO_PAGE[join];
      CrComLib.subscribeState("b", join, function (value) {
        // navigate on rising edge only
        if (value === true) {
          navigateTo(pageName);
        }
      });
    });
    console.log("[v3-nav] subscribed to incoming nav joins:", Object.keys(JOIN_TO_PAGE).join(","));
  }

  /**
   * Wrap navigateTriggerViewByPageName so every local sidebar tap also
   * pulses the corresponding digital join out to the control system.
   */
  function hookOutgoingPulses() {
    var orig = templatePageModule.navigateTriggerViewByPageName;
    templatePageModule.navigateTriggerViewByPageName = function (pageName) {
      var join = PAGE_TO_JOIN[pageName];
      if (join) {
        pulseJoin(join);
      }
      return orig.apply(this, arguments);
    };
    console.log("[v3-nav] outgoing-pulse hook installed on navigateTriggerViewByPageName");
  }

  function bootstrap() {
    if (!isReady()) {
      return false;
    }
    subscribeIncomingJoins();
    hookOutgoingPulses();
    return true;
  }

  // Try immediately; otherwise poll for crcomlib + shell template to finish init
  if (!bootstrap()) {
    var attempts = 0;
    var poll = setInterval(function () {
      attempts++;
      if (bootstrap() || attempts > 100) {
        clearInterval(poll);
        if (attempts > 100) {
          console.warn("[v3-nav] gave up waiting for CrComLib + templatePageModule");
        }
      }
    }, 200);
  }
})();
