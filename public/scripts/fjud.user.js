// ==UserScript==
// @name         FJUD 一鍵查詢（加速版）
// @namespace    https://github.com/mt019/fjud-userscript
// @version      1.2.0
// @description  選中文字→快捷鍵→開啟裁判書系統並自動送出（最小延遲）
// @author       mt019
// @license      MIT
// @homepageURL  https://phenomcanvas.com/userscripts/fjud
// @supportURL   https://github.com/mt019/fjud-userscript/issues
// @updateURL    https://phenomcanvas.com/scripts/fjud.user.js
// @downloadURL  https://phenomcanvas.com/scripts/fjud.user.js
// @icon         https://judicial.gov.tw/images/favicon.ico
// @match        *://*/*
// @match        https://judgment.judicial.gov.tw/FJUD/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_openInTab
// ==/UserScript==

(function () {
  const FJUD = "https://judgment.judicial.gov.tw/FJUD/default.aspx";
  const KEY  = "YY_FJUD_Q";

  // 全站監聽快捷鍵（含目標站）
  document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    if ((isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key.toUpperCase() === "P") {
      const q = (window.getSelection().toString() || "").trim();
      if (!q) return;
      GM_setValue(KEY, q);
      GM_openInTab(FJUD, { active: true });
    }
  });

  // 僅在目標路徑自動填送
  if (!location.pathname.startsWith("/FJUD/")) return;

  const q = (GM_getValue(KEY) || "").trim();
  if (q) GM_deleteValue(KEY);
  if (!q) return;

  const tryFill = () => {
    const kw  = document.querySelector("#txtKW");
    const btn = document.querySelector("#btnSimpleQry");
    if (!kw || !btn) return false;
    kw.focus();
    kw.value = q;
    kw.dispatchEvent(new Event("input", { bubbles: true }));
    btn.click();
    return true;
  };

  if (tryFill()) return;

  const obs = new MutationObserver(() => { if (tryFill()) obs.disconnect(); });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", tryFill, { once: true });
  setTimeout(() => obs.disconnect(), 10000);
})();
