// ==UserScript==
// @name         Social Auto Expand
// @namespace    https://github.com/mt019/social-auto-expand-userscript
// @version      2.1.0
// @description  Automatically expands collapsed social feed text and preloads more feed items across supported sites.
// @author       mt019
// @license      MIT
// @homepageURL  https://phenomcanvas.com/userscripts/social-auto-expand
// @supportURL   https://github.com/mt019/social-auto-expand-userscript/issues
// @updateURL    https://phenomcanvas.com/scripts/social-auto-expand.user.js
// @downloadURL  https://phenomcanvas.com/scripts/social-auto-expand.user.js
// @match        https://www.linkedin.com/*
// @match        https://linkedin.com/*
// @match        https://www.facebook.com/*
// @match        https://web.facebook.com/*
// @match        https://m.facebook.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const COMMON_EXPAND_TEXT_PATTERNS = [
    /^see more$/i,
    /^show more$/i,
    /^read more$/i,
    /^view more$/i,
    /^load more$/i,
    /^show all$/i,
    /^(?:\.\.\.|…|⋯)+\s*see more$/i,
    /^查看更多$/,
    /^顯示更多$/,
    /^显示更多$/,
    /^展開全文$/,
    /^展开全文$/,
    /^展開$/,
    /^展开$/,
    /^(?:\.\.\.|…|⋯)+\s*查看更多$/,
    /^(?:\.\.\.|…|⋯)+\s*顯示更多$/,
    /^(?:\.\.\.|…|⋯)+\s*显示更多$/,
    /^(?:\.\.\.|…|⋯)+\s*展開$/,
    /^(?:\.\.\.|…|⋯)+\s*展开$/,
  ];

  const COMMON_COLLAPSE_TEXT_PATTERNS = [
    /^see less$/i,
    /^show less$/i,
    /^less$/i,
    /^顯示較少$/,
    /^显示较少$/,
    /^收起$/,
  ];

  const SITE_PROFILES = [
    {
      id: "linkedin",
      hostPattern: /(^|\.)linkedin\.com$/,
      clickableSelectors: [
        ".feed-shared-update-v2 button",
        ".feed-shared-update-v2 a",
        '.feed-shared-update-v2 [role="button"]',
        ".occludable-update button",
        ".occludable-update a",
        '.occludable-update [role="button"]',
        '[data-urn*="activity"] button',
        '[data-urn*="activity"] a',
        '[data-urn*="activity"] [role="button"]',
        ".update-components-text button",
        ".update-components-text a",
        '.update-components-text [role="button"]',
        ".comments-comment-item button",
        ".comments-comment-item a",
        '.comments-comment-item [role="button"]',
        ".jobs-description button",
        ".jobs-description a",
        '.jobs-description [role="button"]',
        ".pvs-list button",
        ".pvs-list a",
        '.pvs-list [role="button"]',
        ".feed-shared-inline-show-more-text__see-more-less-toggle",
        ".inline-show-more-text__button",
        ".lt-line-clamp__more",
        ".comments-comment-item__inline-show-more-text",
      ],
      componentSelectors: [
        ".feed-shared-inline-show-more-text__see-more-less-toggle",
        ".inline-show-more-text__button",
        ".lt-line-clamp__more",
        ".comments-comment-item__inline-show-more-text",
        ".see-more-less-toggle",
        ".see-more-less-toggle__button",
        '[data-test-inline-show-more-text="see-more-less-toggle"]',
      ],
      contentAncestorSelectors: [
        ".feed-shared-update-v2",
        ".occludable-update",
        '[data-urn*="activity"]',
        ".update-components-text",
        ".comments-comment-item",
        ".jobs-description",
        ".pvs-list",
        ".scaffold-finite-scroll__content",
      ],
      excludedAncestorSelectors: [
        "header",
        "footer",
        "nav",
        '[role="navigation"]',
        '[role="dialog"]',
        ".global-footer",
        ".artdeco-global-alert",
      ],
      extraExpandTextPatterns: [/^show translation$/i],
      blockingDialogSelector: '[role="dialog"], .artdeco-modal, .msg-overlay-conversation-bubble',
      preloadMode: "jump-scroll",
    },
    {
      id: "facebook",
      hostPattern: /(^|\.)facebook\.com$/,
      clickableSelectors: [
        '[role="article"] [role="button"]',
        '[role="article"] a',
        '[data-pagelet^="FeedUnit"] [role="button"]',
        '[data-pagelet^="FeedUnit"] a',
        '[data-pagelet*="ProfileTimeline"] [role="button"]',
        '[data-pagelet*="ProfileTimeline"] a',
        '[data-pagelet*="GroupFeed"] [role="button"]',
        '[data-pagelet*="GroupFeed"] a',
        '[data-ad-preview="message"] [role="button"]',
        '[data-ad-comet-preview="message"] [role="button"]',
        'div[dir="auto"] [role="button"]',
      ],
      componentSelectors: [],
      contentAncestorSelectors: [
        '[role="article"]',
        '[data-pagelet^="FeedUnit"]',
        '[data-pagelet*="ProfileTimeline"]',
        '[data-pagelet*="GroupFeed"]',
        '[data-ad-preview="message"]',
        '[data-ad-comet-preview="message"]',
      ],
      excludedAncestorSelectors: [
        "header",
        "nav",
        '[role="navigation"]',
        '[role="banner"]',
        '[role="dialog"]',
        '[aria-label="Account"]',
        '[aria-label="Notifications"]',
        '[aria-label="Messenger"]',
      ],
      extraExpandTextPatterns: [/^more$/i],
      blockingDialogSelector: '[role="dialog"], [aria-modal="true"]',
      preloadMode: "disabled",
    },
  ];

  const activeProfile = SITE_PROFILES.find((profile) => profile.hostPattern.test(window.location.hostname));

  if (!activeProfile) {
    return;
  }

  const CLICKED_MARK = `data-social-auto-expand-clicked-${activeProfile.id}`;
  const CLICKABLE_SELECTOR = activeProfile.clickableSelectors.join(",");
  const COMPONENT_SELECTOR = activeProfile.componentSelectors.join(",");
  const CONTENT_ANCESTOR_SELECTOR = activeProfile.contentAncestorSelectors.join(",");
  const EXCLUDED_ANCESTOR_SELECTOR = activeProfile.excludedAncestorSelectors.join(",");
  const EXPAND_TEXT_PATTERNS = COMMON_EXPAND_TEXT_PATTERNS.concat(activeProfile.extraExpandTextPatterns || []);
  const SCAN_INTERVAL_MS = 1200;
  const MUTATION_DEBOUNCE_MS = 250;
  const PRELOAD_INTERVAL_MS = 5000;
  const PRELOAD_RESTORE_DELAY_MS = 80;
  const PRELOAD_SETTLE_DELAY_MS = 1600;
  const PRELOAD_USER_ACTIVITY_COOLDOWN_MS = 1800;
  const PRELOAD_MAX_ROUNDS = 30;
  const PRELOAD_STABLE_HEIGHT_LIMIT = 4;
  const MAX_TEXT_LENGTH = 80;

  let scanTimer = null;
  let preloadTimer = null;
  let observerTimer = null;
  let isPreloading = false;
  let preloadRounds = 0;
  let stableHeightRounds = 0;
  let lastUserActivityAt = 0;

  function normalizeText(text) {
    return text
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isVisible(element) {
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getCandidateText(element) {
    const text = element.innerText || element.textContent || "";
    const ariaLabel = element.getAttribute("aria-label") || "";
    const title = element.getAttribute("title") || "";

    return [text, ariaLabel, title].map(normalizeText).filter(Boolean);
  }

  function isInsideContent(element) {
    return Boolean(CONTENT_ANCESTOR_SELECTOR && element.closest(CONTENT_ANCESTOR_SELECTOR));
  }

  function isExcluded(element) {
    return Boolean(EXCLUDED_ANCESTOR_SELECTOR && element.closest(EXCLUDED_ANCESTOR_SELECTOR));
  }

  function isKnownCollapsedComponent(element) {
    if (!COMPONENT_SELECTOR || !element.matches(COMPONENT_SELECTOR)) {
      return false;
    }

    const expanded = element.getAttribute("aria-expanded");
    return expanded !== "true" && isInsideContent(element);
  }

  function looksLikeExpander(element) {
    const candidateTexts = getCandidateText(element);

    if (candidateTexts.length === 0) {
      return false;
    }

    if (candidateTexts.some((text) => text.length > MAX_TEXT_LENGTH)) {
      return false;
    }

    if (candidateTexts.some((text) => COMMON_COLLAPSE_TEXT_PATTERNS.some((pattern) => pattern.test(text)))) {
      return false;
    }

    return candidateTexts.some((text) => EXPAND_TEXT_PATTERNS.some((pattern) => pattern.test(text)));
  }

  function clickExpander(element) {
    if (element.hasAttribute(CLICKED_MARK) || isExcluded(element) || !isInsideContent(element) || !isVisible(element)) {
      return false;
    }

    if (!isKnownCollapsedComponent(element) && !looksLikeExpander(element)) {
      return false;
    }

    element.setAttribute(CLICKED_MARK, "true");
    element.click();
    return true;
  }

  function scan(root = document) {
    const candidates = root.querySelectorAll(CLICKABLE_SELECTOR);

    for (const candidate of candidates) {
      clickExpander(candidate);
    }
  }

  function scheduleScan() {
    window.clearTimeout(observerTimer);
    observerTimer = window.setTimeout(() => scan(), MUTATION_DEBOUNCE_MS);
  }

  function getDocumentHeight() {
    return Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
    );
  }

  function hasBlockingDialog() {
    return Boolean(document.querySelector(activeProfile.blockingDialogSelector));
  }

  function isRecentUserActivity() {
    return Date.now() - lastUserActivityAt < PRELOAD_USER_ACTIVITY_COOLDOWN_MS;
  }

  function markUserActivity() {
    if (!isPreloading) {
      lastUserActivityAt = Date.now();
    }
  }

  function shouldPreloadMoreContent() {
    return (
      document.visibilityState === "visible" &&
      activeProfile.preloadMode !== "disabled" &&
      !isPreloading &&
      !isRecentUserActivity() &&
      !hasBlockingDialog() &&
      preloadRounds < PRELOAD_MAX_ROUNDS &&
      stableHeightRounds < PRELOAD_STABLE_HEIGHT_LIMIT
    );
  }

  function preloadMoreContent() {
    if (!shouldPreloadMoreContent()) {
      return;
    }

    const previousX = window.scrollX;
    const previousY = window.scrollY;
    const heightBefore = getDocumentHeight();
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;

    isPreloading = true;
    preloadRounds += 1;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(previousX, heightBefore);
    window.dispatchEvent(new Event("scroll"));

    window.setTimeout(() => {
      window.scrollTo(previousX, previousY);
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
      isPreloading = false;

      window.setTimeout(() => {
        const heightAfter = getDocumentHeight();
        stableHeightRounds = heightAfter > heightBefore ? 0 : stableHeightRounds + 1;
        scan();
      }, PRELOAD_SETTLE_DELAY_MS);
    }, PRELOAD_RESTORE_DELAY_MS);
  }

  function addUserActivityListeners() {
    const activityEvents = ["wheel", "touchstart", "keydown", "mousedown"];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, markUserActivity, { passive: true });
    }
  }

  function start() {
    scan();
    addUserActivityListeners();
    scanTimer = window.setInterval(scan, SCAN_INTERVAL_MS);
    preloadTimer = window.setInterval(preloadMoreContent, PRELOAD_INTERVAL_MS);

    const observer = new MutationObserver(scheduleScan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("beforeunload", () => {
      window.clearInterval(scanTimer);
      window.clearInterval(preloadTimer);
      observer.disconnect();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
