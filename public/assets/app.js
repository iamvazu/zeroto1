/* zeroto1.academy — shared client behavior
   Region switching (US / India) with localStorage persistence + pricing localization. */

(function () {
  var REGION_KEY = "z1_region";
  var REGION = window.__Z1_REGION__ || "us";

  /* ---------- Region ---------- */
  function detectRegion() {
    var stored = null;
    try { stored = localStorage.getItem(REGION_KEY); } catch (e) {}
    if (stored === "in" || stored === "us") return stored;
    // Lightweight locale hint; default US.
    var lang = (navigator.language || "en-US").toLowerCase();
    if (lang.indexOf("en-in") === 0) return "in";
    return "us";
  }

  function setRegion(region) {
    try { localStorage.setItem(REGION_KEY, region); } catch (e) {}
    window.location.reload();
  }

  function initRegionSwitch() {
    var current = detectRegion();
    document.querySelectorAll("[data-region-set]").forEach(function (el) {
      el.addEventListener("click", function (ev) {
        ev.preventDefault();
        setRegion(el.getAttribute("data-region-set"));
      });
      if (el.getAttribute("data-region-set") === current) {
        el.setAttribute("aria-current", "true");
      } else {
        el.removeAttribute("aria-current");
      }
    });
    document.querySelectorAll("[data-region-label]").forEach(function (el) {
      el.textContent = current === "in" ? "India" : "United States";
    });
  }

  /* ---------- Pricing localization ---------- */
  var PRICING = {
    us: {
      currency: "$",
      monthly: "19",
      yearly: "99",
      monthlyPer: "/month",
      yearlyPer: "/year",
      listYearly: "$150",
      monthlyNote: "Billed $19/month · Cancel anytime",
      yearlyNote: "Founding Member · Billed $99/year · Cancel anytime",
      refundContact: "hello@zeroto1.academy"
    },
    in: {
      currency: "₹",
      monthly: "999",
      yearly: "7,999",
      monthlyPer: "/month",
      yearlyPer: "/year",
      listYearly: "₹12,499",
      monthlyNote: "Billed ₹999/month · Cancel anytime",
      yearlyNote: "Founding Member · Billed ₹7,999/year · Cancel anytime",
      refundContact: "hello@zeroto1.academy"
    }
  };

  function applyPricing() {
    var region = detectRegion();
    var p = PRICING[region];
    if (!p) return;

    document.querySelectorAll("[data-price]").forEach(function (el) {
      var kind = el.getAttribute("data-price");
      if (kind === "monthly") el.textContent = p.monthly;
      else if (kind === "yearly") el.textContent = p.yearly;
      else if (kind === "list-yearly") el.textContent = p.listYearly;
      else if (kind === "monthly-per") el.textContent = p.monthlyPer;
      else if (kind === "yearly-per") el.textContent = p.yearlyPer;
      else if (kind === "currency") el.textContent = p.currency;
      else if (kind === "monthly-note") el.textContent = p.monthlyNote;
      else if (kind === "yearly-note") el.textContent = p.yearlyNote;
      else if (kind === "refund-contact") el.textContent = p.refundContact;
    });

    // billing toggle: show/hide the active amount
    var toggle = document.querySelector("[data-billing-toggle]");
    if (toggle) {
      var isYearly = toggle.getAttribute("data-billing") === "yearly";
      document.querySelectorAll("[data-bill-monthly]").forEach(function (el) {
        el.style.display = isYearly ? "none" : "";
      });
      document.querySelectorAll("[data-bill-yearly]").forEach(function (el) {
        el.style.display = isYearly ? "" : "none";
      });
      toggle.querySelectorAll("button").forEach(function (b) {
        var pressed = b.getAttribute("data-set") === (isYearly ? "yearly" : "monthly");
        b.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
    }
  }

  function initBillingToggle() {
    var toggle = document.querySelector("[data-billing-toggle]");
    if (!toggle) return;
    toggle.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        toggle.setAttribute("data-billing", b.getAttribute("data-set"));
        applyPricing();
      });
    });
    applyPricing();
  }

  /* ---------- Boot ---------- */
  window.addEventListener("DOMContentLoaded", function () {
    initRegionSwitch();
    initBillingToggle();
    applyPricing();
  });
})();
